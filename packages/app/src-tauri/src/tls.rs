//! Local TLS material for the loopback API.
//!
//! The API used to be served with an `mkcert` keypair that was baked into the
//! app bundle. That meant every install shared one private key, the key was
//! handed out to anyone who downloaded a DMG, and it carried a fixed expiry
//! date that no release could move.
//!
//! Instead we mint a keypair on first launch, store it under the app's local
//! data directory with 0600 permissions, and rotate it automatically as it
//! nears expiry.
//!
//! The certificate is **self-signed and self-anchored**: it is not issued by a
//! local CA. `scripts/trust-cert.sh` marks this one leaf as a trusted SSL
//! anchor. That is deliberate — a local CA key sitting on disk could mint a
//! valid certificate for *any* hostname, whereas this key can only ever
//! impersonate `localhost:57404`, which is authority the app already has.

use openssl::asn1::{Asn1Integer, Asn1Time};
use openssl::bn::{BigNum, MsbOption};
use openssl::hash::MessageDigest;
use openssl::pkey::{PKey, Private};
use openssl::rsa::Rsa;
use openssl::x509::extension::{
    BasicConstraints, ExtendedKeyUsage, KeyUsage, SubjectAlternativeName, SubjectKeyIdentifier,
};
use openssl::x509::{X509NameBuilder, X509};
use std::cmp::Ordering;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

/// Validity window for a freshly minted certificate. 825 days is the longest
/// lifetime Apple's platform policies have historically accepted.
const VALIDITY_DAYS: u32 = 825;

/// Rotate once the certificate has less than this long to live, so a
/// long-running install never wakes up to an expired API.
const RENEW_BEFORE_DAYS: u32 = 30;

pub struct LocalTls {
    pub key_path: PathBuf,
    pub cert_path: PathBuf,
}

/// Directory holding the local TLS material, created if missing.
pub fn cert_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Cannot resolve app local data dir: {}", e))?
        .join("certs");

    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create {:?}: {}", dir, e))?;
    restrict(&dir, 0o700)?;

    Ok(dir)
}

/// Returns usable TLS material, generating or rotating it if needed.
pub fn ensure(app: &AppHandle) -> Result<LocalTls, String> {
    let dir = cert_dir(app)?;
    let tls = LocalTls {
        key_path: dir.join("key.pem"),
        cert_path: dir.join("cert.pem"),
    };

    match inspect(&tls) {
        Ok(true) => {
            log::info!("Reusing local TLS certificate at {:?}", tls.cert_path);
            return Ok(tls);
        }
        Ok(false) => log::info!("Local TLS certificate is missing or near expiry, regenerating"),
        Err(e) => log::warn!("Local TLS certificate unusable ({}), regenerating", e),
    }

    generate(&tls)?;
    log::info!("Generated local TLS certificate at {:?}", tls.cert_path);

    Ok(tls)
}

/// True when both files exist, agree with each other, and the certificate is
/// not about to expire.
fn inspect(tls: &LocalTls) -> Result<bool, String> {
    if !tls.key_path.exists() || !tls.cert_path.exists() {
        return Ok(false);
    }

    let cert_pem = fs::read(&tls.cert_path).map_err(|e| format!("cannot read cert: {}", e))?;
    let key_pem = fs::read(&tls.key_path).map_err(|e| format!("cannot read key: {}", e))?;

    let cert = X509::from_pem(&cert_pem).map_err(|e| format!("cert is not valid PEM: {}", e))?;
    let key = PKey::private_key_from_pem(&key_pem)
        .map_err(|e| format!("key is not valid PEM: {}", e))?;

    // A cert that does not match its key would fail at bind time with a far
    // less obvious error, so treat the mismatch as "regenerate".
    if !cert
        .public_key()
        .map_err(|e| format!("cert has no usable public key: {}", e))?
        .public_eq(&key)
    {
        return Err("certificate does not match private key".into());
    }

    let threshold = Asn1Time::days_from_now(RENEW_BEFORE_DAYS)
        .map_err(|e| format!("cannot compute renewal threshold: {}", e))?;

    let expiring = cert
        .not_after()
        .compare(&threshold)
        .map_err(|e| format!("cannot read cert expiry: {}", e))?
        != Ordering::Greater;

    Ok(!expiring)
}

/// Mint a fresh self-signed certificate for the loopback API.
fn generate(tls: &LocalTls) -> Result<(), String> {
    let rsa = Rsa::generate(2048).map_err(|e| format!("cannot generate key: {}", e))?;
    let key = PKey::from_rsa(rsa).map_err(|e| format!("cannot wrap key: {}", e))?;

    let cert = build_cert(&key)?;

    write_secret(
        &tls.key_path,
        &key.private_key_to_pem_pkcs8()
            .map_err(|e| format!("cannot serialize key: {}", e))?,
    )?;
    write_public(
        &tls.cert_path,
        &cert
            .to_pem()
            .map_err(|e| format!("cannot serialize cert: {}", e))?,
    )?;

    Ok(())
}

fn build_cert(key: &PKey<Private>) -> Result<X509, String> {
    let mut name = X509NameBuilder::new().map_err(|e| e.to_string())?;
    name.append_entry_by_text("O", "codename")
        .map_err(|e| e.to_string())?;
    name.append_entry_by_text("OU", "Stack local API")
        .map_err(|e| e.to_string())?;
    name.append_entry_by_text("CN", "localhost")
        .map_err(|e| e.to_string())?;
    let name = name.build();

    let serial = serial()?;

    let mut builder = openssl::x509::X509Builder::new().map_err(|e| e.to_string())?;
    builder.set_version(2).map_err(|e| e.to_string())?; // X.509 v3
    builder.set_serial_number(&serial).map_err(|e| e.to_string())?;
    builder.set_subject_name(&name).map_err(|e| e.to_string())?;
    builder.set_issuer_name(&name).map_err(|e| e.to_string())?; // self-signed
    builder.set_pubkey(key).map_err(|e| e.to_string())?;

    let not_before = Asn1Time::days_from_now(0).map_err(|e| e.to_string())?;
    let not_after = Asn1Time::days_from_now(VALIDITY_DAYS).map_err(|e| e.to_string())?;
    builder.set_not_before(&not_before).map_err(|e| e.to_string())?;
    builder.set_not_after(&not_after).map_err(|e| e.to_string())?;

    // Not a CA: this certificate cannot vouch for anything but itself, even
    // once the user has marked it as a trusted anchor.
    builder
        .append_extension(
            BasicConstraints::new()
                .critical()
                .build()
                .map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string())?;
    builder
        .append_extension(
            KeyUsage::new()
                .critical()
                .digital_signature()
                .key_encipherment()
                .build()
                .map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string())?;
    builder
        .append_extension(
            ExtendedKeyUsage::new()
                .server_auth()
                .build()
                .map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string())?;

    let ctx = builder.x509v3_context(None, None);
    let san = SubjectAlternativeName::new()
        .dns("localhost")
        .ip("127.0.0.1")
        .ip("::1")
        .build(&ctx)
        .map_err(|e| e.to_string())?;
    let skid = SubjectKeyIdentifier::new()
        .build(&ctx)
        .map_err(|e| e.to_string())?;
    builder.append_extension(san).map_err(|e| e.to_string())?;
    builder.append_extension(skid).map_err(|e| e.to_string())?;

    builder
        .sign(key, MessageDigest::sha256())
        .map_err(|e| format!("cannot sign cert: {}", e))?;

    Ok(builder.build())
}

fn serial() -> Result<Asn1Integer, String> {
    let mut bn = BigNum::new().map_err(|e| e.to_string())?;
    bn.rand(159, MsbOption::MAYBE_ZERO, false)
        .map_err(|e| e.to_string())?;
    bn.to_asn1_integer().map_err(|e| e.to_string())
}

fn write_secret(path: &Path, bytes: &[u8]) -> Result<(), String> {
    fs::write(path, bytes).map_err(|e| format!("cannot write {:?}: {}", path, e))?;
    restrict(path, 0o600)
}

fn write_public(path: &Path, bytes: &[u8]) -> Result<(), String> {
    fs::write(path, bytes).map_err(|e| format!("cannot write {:?}: {}", path, e))?;
    restrict(path, 0o644)
}

#[cfg(unix)]
fn restrict(path: &Path, mode: u32) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;

    fs::set_permissions(path, fs::Permissions::from_mode(mode))
        .map_err(|e| format!("cannot chmod {:?}: {}", path, e))
}

#[cfg(not(unix))]
fn restrict(_path: &Path, _mode: u32) -> Result<(), String> {
    // Windows inherits the per-user ACL of the app data directory.
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scratch() -> (tempfile::TempDir, LocalTls) {
        let dir = tempfile::tempdir().unwrap();
        let tls = LocalTls {
            key_path: dir.path().join("key.pem"),
            cert_path: dir.path().join("cert.pem"),
        };
        (dir, tls)
    }

    #[test]
    fn generates_a_usable_self_anchored_cert() {
        let (_dir, tls) = scratch();
        generate(&tls).unwrap();

        let cert = X509::from_pem(&fs::read(&tls.cert_path).unwrap()).unwrap();

        // Self-signed, and it verifies against itself: it is its own anchor.
        assert_eq!(
            format!("{:?}", cert.subject_name()),
            format!("{:?}", cert.issuer_name())
        );
        assert!(cert.verify(&cert.public_key().unwrap()).unwrap());

        // Covers exactly the loopback names the website dials.
        let sans: Vec<String> = cert
            .subject_alt_names()
            .unwrap()
            .iter()
            .map(|n| {
                n.dnsname()
                    .map(str::to_string)
                    .or_else(|| n.ipaddress().map(|ip| format!("{:?}", ip)))
                    .unwrap()
            })
            .collect();
        assert!(sans.iter().any(|s| s == "localhost"), "sans: {:?}", sans);
        assert_eq!(sans.len(), 3, "sans: {:?}", sans);

        // Not a CA: cannot mint certificates for other hosts once trusted.
        let text = String::from_utf8(cert.to_text().unwrap()).unwrap();
        assert!(text.contains("CA:FALSE"), "{}", text);

        assert!(inspect(&tls).unwrap(), "freshly minted cert should be valid");
    }

    #[test]
    fn rejects_a_cert_that_does_not_match_its_key() {
        let (_dir, tls) = scratch();
        generate(&tls).unwrap();

        // Swap in an unrelated key, as a half-finished rotation would.
        let (_other_dir, other) = scratch();
        generate(&other).unwrap();
        fs::copy(&other.key_path, &tls.key_path).unwrap();

        assert!(inspect(&tls).is_err());
    }

    #[test]
    fn regenerates_when_files_are_missing() {
        let (_dir, tls) = scratch();
        assert!(!inspect(&tls).unwrap());
    }

    #[cfg(unix)]
    #[test]
    fn private_key_is_not_world_readable() {
        use std::os::unix::fs::PermissionsExt;

        let (_dir, tls) = scratch();
        generate(&tls).unwrap();

        let mode = fs::metadata(&tls.key_path).unwrap().permissions().mode();
        assert_eq!(mode & 0o077, 0, "key mode: {:o}", mode);
    }
}
