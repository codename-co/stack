//! Local TLS material.
//!
//! Two independent sets of keys live here, both minted per install and both
//! stored under the app's local data directory with 0600 permissions. Nothing
//! is baked into the app bundle: a shipped private key is a published private
//! key.
//!
//! 1. **The loopback API** (`127.0.0.1:57404`) gets a self-signed, *self
//!    anchored* leaf. `scripts/trust-cert.sh` marks that one leaf as a trusted
//!    SSL anchor. It is not a CA, so trusting it grants no authority beyond
//!    `localhost`, which the app already has.
//!
//! 2. **The reverse proxy** serving `*.stack.localhost` cannot use a
//!    self-anchored leaf: the hostname set changes every time a stack is
//!    installed, and re-prompting for an admin password per stack is not a
//!    product. It therefore gets a small PKI:
//!
//!    ```text
//!    Stack Local CA            (root, trusted by the user, key destroyed)
//!      └── Stack Local CA — stack.localhost   (issuing CA, name-constrained)
//!            └── *.stack.localhost            (leaf, rotated automatically)
//!    ```
//!
//!    Two properties make this safe to leave on disk, which is what the old
//!    committed "Stack Root CA" was not:
//!
//!    * The **root key is never written anywhere**. It exists in memory just
//!      long enough to sign the issuing CA and is then dropped. The anchor the
//!      user trusts therefore has no usable private key, on this machine or
//!      any other.
//!    * The issuing CA — the only CA key that does survive — carries a
//!      *critical* `nameConstraints` extension permitting `stack.localhost`
//!      and its subdomains and excluding every IP address, plus `pathlen:0`
//!      and `serverAuth`-only EKU. Stealing it buys an attacker the ability to
//!      impersonate `*.stack.localhost` — hosts that already resolve to this
//!      machine's loopback — and nothing else. macOS, NSS and Chrome's
//!      verifier all enforce name constraints, so a forged `www.google.com`
//!      certificate is rejected at chain-building time.

use openssl::asn1::{Asn1Integer, Asn1Time};
use openssl::bn::{BigNum, MsbOption};
use openssl::hash::MessageDigest;
use openssl::nid::Nid;
use openssl::pkey::{PKey, Private};
use openssl::rsa::Rsa;
use openssl::x509::extension::{
    AuthorityKeyIdentifier, BasicConstraints, ExtendedKeyUsage, KeyUsage, SubjectAlternativeName,
    SubjectKeyIdentifier,
};
use openssl::x509::{X509Extension, X509NameBuilder, X509};
use std::cmp::Ordering;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

/// Validity window for a freshly minted leaf certificate. 825 days is the
/// longest lifetime Apple's platform policies have historically accepted.
const VALIDITY_DAYS: u32 = 825;

/// Rotate once the certificate has less than this long to live, so a
/// long-running install never wakes up to an expired API.
const RENEW_BEFORE_DAYS: u32 = 30;

/// Lifetime of the local PKI. Rebuilding it costs the user an admin prompt
/// (the new anchor has to be trusted), so it is deliberately long-lived, while
/// the leaf underneath it keeps rotating on the schedule above.
const CA_VALIDITY_DAYS: u32 = 3650;

/// Rebuild the PKI well before the issuing CA lapses, so the leaf never
/// outlives its issuer.
const CA_RENEW_BEFORE_DAYS: u32 = 90;

/// The domain the reverse proxy serves stacks on. Everything the issuing CA is
/// allowed to vouch for lives under it.
pub const PROXY_DOMAIN: &str = "stack.localhost";

/// Common name of the trust anchor. `scripts/trust-cert.sh` looks for it when
/// clearing out superseded anchors, so the two must agree.
pub const PROXY_CA_NAME: &str = "Stack Local CA";

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

/// Directory holding the material handed to the reverse proxy. It is mounted
/// read-only into the traefik container, so it holds *only* the proxy chain —
/// never the API key.
pub fn proxy_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = cert_dir(app)?.join("proxy");

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

/// The reverse proxy's material, as paths on disk.
pub struct ProxyTls {
    /// Directory mounted into the proxy container.
    pub dir: PathBuf,
    /// Trust anchor, the file the user is asked to trust. Public, keyless.
    pub root_path: PathBuf,
    /// Issuing CA certificate and its (name-constrained) key.
    pub issuer_path: PathBuf,
    pub issuer_key_path: PathBuf,
    /// Leaf chain (leaf + issuing CA) and key, served by the proxy.
    pub chain_path: PathBuf,
    pub key_path: PathBuf,
    /// True when the anchor changed and the user has to run "Trust
    /// certificate" again.
    pub anchor_is_new: bool,
}

impl ProxyTls {
    /// Fingerprint of the leaf currently on disk.
    ///
    /// The proxy container gets this as an environment variable it never
    /// reads: traefik watches its configuration file but not the certificate
    /// files that file points at, so a rotated leaf would otherwise only be
    /// picked up whenever the container happened to be recreated. Feeding the
    /// fingerprint into the container's definition makes `docker compose up`
    /// recreate it exactly when — and only when — the certificate changed.
    pub fn fingerprint(&self) -> Result<String, String> {
        let chain = fs::read(&self.chain_path)
            .map_err(|e| format!("cannot read {:?}: {}", self.chain_path, e))?;
        let leaf = X509::stack_from_pem(&chain)
            .map_err(|e| format!("chain is not valid PEM: {}", e))?
            .into_iter()
            .next()
            .ok_or_else(|| "chain file holds no certificate".to_string())?;
        let digest = leaf
            .digest(MessageDigest::sha256())
            .map_err(|e| format!("cannot digest proxy certificate: {}", e))?;

        Ok(digest.iter().map(|b| format!("{:02x}", b)).collect())
    }

    fn at(dir: PathBuf) -> Self {
        Self {
            root_path: dir.join("root.pem"),
            issuer_path: dir.join("issuer.pem"),
            issuer_key_path: dir.join("issuer-key.pem"),
            chain_path: dir.join("chain.pem"),
            key_path: dir.join("key.pem"),
            anchor_is_new: false,
            dir,
        }
    }
}

/// Returns usable proxy TLS material, building the local PKI on first launch
/// and rotating the leaf as it nears expiry.
pub fn ensure_proxy(app: &AppHandle) -> Result<ProxyTls, String> {
    ensure_proxy_at(proxy_dir(app)?)
}

fn ensure_proxy_at(dir: PathBuf) -> Result<ProxyTls, String> {
    let mut tls = ProxyTls::at(dir);

    let issuer = match load_issuer(&tls) {
        Ok(Some(issuer)) => issuer,
        Ok(None) => {
            log::info!("Building the local certificate authority for *.{}", PROXY_DOMAIN);
            tls.anchor_is_new = true;
            build_authority(&tls)?
        }
        Err(e) => {
            log::warn!("Local certificate authority unusable ({}), rebuilding", e);
            tls.anchor_is_new = true;
            build_authority(&tls)?
        }
    };

    match inspect_leaf(&tls, &issuer.0) {
        Ok(true) => {
            log::info!("Reusing proxy certificate at {:?}", tls.chain_path);
            return Ok(tls);
        }
        Ok(false) => log::info!("Proxy certificate is missing or near expiry, regenerating"),
        Err(e) => log::warn!("Proxy certificate unusable ({}), regenerating", e),
    }

    issue_leaf(&tls, &issuer)?;
    log::info!("Issued proxy certificate for *.{}", PROXY_DOMAIN);

    if tls.anchor_is_new {
        log::warn!(
            "A new trust anchor was created at {:?}. Run \"Trust certificate\" from the menu so \
             browsers accept https://*.{}",
            tls.root_path,
            PROXY_DOMAIN
        );
    }

    Ok(tls)
}

/// Loads the issuing CA, or `None` when it has to be (re)built.
fn load_issuer(tls: &ProxyTls) -> Result<Option<(X509, PKey<Private>)>, String> {
    if !tls.root_path.exists() || !tls.issuer_path.exists() || !tls.issuer_key_path.exists() {
        return Ok(None);
    }

    let root = read_cert(&tls.root_path)?;
    let cert = read_cert(&tls.issuer_path)?;
    let key = read_key(&tls.issuer_key_path)?;

    if !cert
        .public_key()
        .map_err(|e| format!("issuing CA has no usable public key: {}", e))?
        .public_eq(&key)
    {
        return Err("issuing CA does not match its private key".into());
    }

    // A chain that does not actually chain would only fail in the browser,
    // where the error is far harder to read.
    let root_key = root
        .public_key()
        .map_err(|e| format!("anchor has no usable public key: {}", e))?;
    if !cert
        .verify(&root_key)
        .map_err(|e| format!("cannot verify issuing CA: {}", e))?
    {
        return Err("issuing CA was not signed by the stored anchor".into());
    }

    if expiring(&cert, CA_RENEW_BEFORE_DAYS)? || expiring(&root, CA_RENEW_BEFORE_DAYS)? {
        return Ok(None);
    }

    Ok(Some((cert, key)))
}

/// Mints the anchor and the name-constrained issuing CA underneath it.
///
/// The anchor's private key is deliberately never written to disk: it is
/// dropped when this function returns, which is what makes the anchor safe to
/// install in the system trust store.
fn build_authority(tls: &ProxyTls) -> Result<(X509, PKey<Private>), String> {
    let root_key = generate_key()?;
    let root = build_root(&root_key)?;

    let issuer_key = generate_key()?;
    let issuer = build_issuer(&root, &root_key, &issuer_key)?;

    write_public(&tls.root_path, &pem(&root)?)?;
    write_public(&tls.issuer_path, &pem(&issuer)?)?;
    write_secret(&tls.issuer_key_path, &pem_key(&issuer_key)?)?;

    // Force the leaf to be re-issued under the new authority.
    let _ = fs::remove_file(&tls.chain_path);
    let _ = fs::remove_file(&tls.key_path);

    Ok((issuer, issuer_key))
}

fn build_root(key: &PKey<Private>) -> Result<X509, String> {
    let name = subject(PROXY_CA_NAME, "Stack local certificate authority")?;

    let mut builder = openssl::x509::X509Builder::new().map_err(|e| e.to_string())?;
    builder.set_version(2).map_err(|e| e.to_string())?;
    let serial = serial()?;
    builder.set_serial_number(&serial).map_err(|e| e.to_string())?;
    builder.set_subject_name(&name).map_err(|e| e.to_string())?;
    builder.set_issuer_name(&name).map_err(|e| e.to_string())?; // self-signed
    builder.set_pubkey(key).map_err(|e| e.to_string())?;
    set_validity(&mut builder, CA_VALIDITY_DAYS)?;

    // pathlen:1 — exactly enough for the issuing CA and its leaves.
    append(
        &mut builder,
        BasicConstraints::new().critical().ca().pathlen(1).build(),
    )?;
    append(
        &mut builder,
        KeyUsage::new()
            .critical()
            .key_cert_sign()
            .crl_sign()
            .build(),
    )?;

    let ctx = builder.x509v3_context(None, None);
    let skid = SubjectKeyIdentifier::new()
        .build(&ctx)
        .map_err(|e| e.to_string())?;
    builder.append_extension(skid).map_err(|e| e.to_string())?;

    builder
        .sign(key, MessageDigest::sha256())
        .map_err(|e| format!("cannot sign anchor: {}", e))?;

    Ok(builder.build())
}

fn build_issuer(
    root: &X509,
    root_key: &PKey<Private>,
    key: &PKey<Private>,
) -> Result<X509, String> {
    let name = subject(
        &format!("{} \u{2014} {}", PROXY_CA_NAME, PROXY_DOMAIN),
        "Stack local certificate authority",
    )?;

    let mut builder = openssl::x509::X509Builder::new().map_err(|e| e.to_string())?;
    builder.set_version(2).map_err(|e| e.to_string())?;
    let serial = serial()?;
    builder.set_serial_number(&serial).map_err(|e| e.to_string())?;
    builder.set_subject_name(&name).map_err(|e| e.to_string())?;
    builder
        .set_issuer_name(root.subject_name())
        .map_err(|e| e.to_string())?;
    builder.set_pubkey(key).map_err(|e| e.to_string())?;
    set_validity(&mut builder, CA_VALIDITY_DAYS)?;

    append(
        &mut builder,
        BasicConstraints::new().critical().ca().pathlen(0).build(),
    )?;
    append(
        &mut builder,
        KeyUsage::new()
            .critical()
            .key_cert_sign()
            .crl_sign()
            .build(),
    )?;
    append(&mut builder, ExtendedKeyUsage::new().server_auth().build())?;

    // The whole point of this file. `permitted;DNS:stack.localhost` covers the
    // domain and every subdomain of it; excluding both IP ranges stops the key
    // from vouching for a bare address. Marked critical so a verifier that
    // does not understand the extension rejects the chain outright rather than
    // ignoring the limit.
    let constraints = format!(
        "critical,permitted;DNS:{},excluded;IP:0.0.0.0/0.0.0.0,excluded;IP:::/::",
        PROXY_DOMAIN
    );

    let ctx = builder.x509v3_context(Some(root), None);
    #[allow(deprecated)] // no typed builder exists for nameConstraints
    let name_constraints =
        X509Extension::new_nid(None, Some(&ctx), Nid::NAME_CONSTRAINTS, &constraints)
            .map_err(|e| format!("cannot build name constraints: {}", e))?;
    let skid = SubjectKeyIdentifier::new()
        .build(&ctx)
        .map_err(|e| e.to_string())?;
    let akid = AuthorityKeyIdentifier::new()
        .keyid(false)
        .build(&ctx)
        .map_err(|e| e.to_string())?;
    builder
        .append_extension(name_constraints)
        .map_err(|e| e.to_string())?;
    builder.append_extension(skid).map_err(|e| e.to_string())?;
    builder.append_extension(akid).map_err(|e| e.to_string())?;

    builder
        .sign(root_key, MessageDigest::sha256())
        .map_err(|e| format!("cannot sign issuing CA: {}", e))?;

    Ok(builder.build())
}

/// True when the stored leaf is present, matches its key, still has life in it
/// and was issued by the CA currently on disk.
fn inspect_leaf(tls: &ProxyTls, issuer: &X509) -> Result<bool, String> {
    if !tls.chain_path.exists() || !tls.key_path.exists() {
        return Ok(false);
    }

    let chain_pem = fs::read(&tls.chain_path).map_err(|e| format!("cannot read chain: {}", e))?;
    let chain =
        X509::stack_from_pem(&chain_pem).map_err(|e| format!("chain is not valid PEM: {}", e))?;
    let leaf = chain
        .first()
        .ok_or_else(|| "chain file holds no certificate".to_string())?;
    let key = read_key(&tls.key_path)?;

    if !leaf
        .public_key()
        .map_err(|e| format!("leaf has no usable public key: {}", e))?
        .public_eq(&key)
    {
        return Err("proxy certificate does not match its private key".into());
    }

    let issuer_key = issuer
        .public_key()
        .map_err(|e| format!("issuing CA has no usable public key: {}", e))?;
    if !leaf
        .verify(&issuer_key)
        .map_err(|e| format!("cannot verify proxy certificate: {}", e))?
    {
        return Err("proxy certificate was issued by a superseded authority".into());
    }

    Ok(!expiring(leaf, RENEW_BEFORE_DAYS)?)
}

/// Mints the wildcard leaf and writes `leaf + issuing CA` for the proxy.
fn issue_leaf(tls: &ProxyTls, issuer: &(X509, PKey<Private>)) -> Result<(), String> {
    let (issuer_cert, issuer_key) = issuer;
    let key = generate_key()?;

    let wildcard = format!("*.{}", PROXY_DOMAIN);
    let name = subject(&wildcard, "Stack local proxy")?;

    let mut builder = openssl::x509::X509Builder::new().map_err(|e| e.to_string())?;
    builder.set_version(2).map_err(|e| e.to_string())?;
    let serial = serial()?;
    builder.set_serial_number(&serial).map_err(|e| e.to_string())?;
    builder.set_subject_name(&name).map_err(|e| e.to_string())?;
    builder
        .set_issuer_name(issuer_cert.subject_name())
        .map_err(|e| e.to_string())?;
    builder.set_pubkey(&key).map_err(|e| e.to_string())?;
    set_validity(&mut builder, VALIDITY_DAYS)?;

    append(&mut builder, BasicConstraints::new().critical().build())?;
    append(
        &mut builder,
        KeyUsage::new()
            .critical()
            .digital_signature()
            .key_encipherment()
            .build(),
    )?;
    append(&mut builder, ExtendedKeyUsage::new().server_auth().build())?;

    let ctx = builder.x509v3_context(Some(issuer_cert), None);
    // A wildcard matches one label only, so the bare domain — the dashboard —
    // needs its own entry.
    let san = SubjectAlternativeName::new()
        .dns(PROXY_DOMAIN)
        .dns(&wildcard)
        .build(&ctx)
        .map_err(|e| e.to_string())?;
    let skid = SubjectKeyIdentifier::new()
        .build(&ctx)
        .map_err(|e| e.to_string())?;
    let akid = AuthorityKeyIdentifier::new()
        .keyid(false)
        .build(&ctx)
        .map_err(|e| e.to_string())?;
    builder.append_extension(san).map_err(|e| e.to_string())?;
    builder.append_extension(skid).map_err(|e| e.to_string())?;
    builder.append_extension(akid).map_err(|e| e.to_string())?;

    builder
        .sign(issuer_key, MessageDigest::sha256())
        .map_err(|e| format!("cannot sign proxy certificate: {}", e))?;

    let leaf = builder.build();

    // The proxy serves leaf-then-issuer; the anchor stays out of the chain,
    // where it belongs.
    let mut chain = pem(&leaf)?;
    chain.extend_from_slice(&pem(issuer_cert)?);

    write_secret(&tls.key_path, &pem_key(&key)?)?;
    write_public(&tls.chain_path, &chain)?;

    Ok(())
}

fn generate_key() -> Result<PKey<Private>, String> {
    let rsa = Rsa::generate(2048).map_err(|e| format!("cannot generate key: {}", e))?;
    PKey::from_rsa(rsa).map_err(|e| format!("cannot wrap key: {}", e))
}

fn subject(cn: &str, ou: &str) -> Result<openssl::x509::X509Name, String> {
    let mut name = X509NameBuilder::new().map_err(|e| e.to_string())?;
    name.append_entry_by_text("O", "codename")
        .map_err(|e| e.to_string())?;
    name.append_entry_by_text("OU", ou)
        .map_err(|e| e.to_string())?;
    name.append_entry_by_text("CN", cn)
        .map_err(|e| e.to_string())?;
    Ok(name.build())
}

fn set_validity(builder: &mut openssl::x509::X509Builder, days: u32) -> Result<(), String> {
    let not_before = Asn1Time::days_from_now(0).map_err(|e| e.to_string())?;
    let not_after = Asn1Time::days_from_now(days).map_err(|e| e.to_string())?;
    builder.set_not_before(&not_before).map_err(|e| e.to_string())?;
    builder.set_not_after(&not_after).map_err(|e| e.to_string())
}

fn append(
    builder: &mut openssl::x509::X509Builder,
    ext: Result<X509Extension, openssl::error::ErrorStack>,
) -> Result<(), String> {
    let ext = ext.map_err(|e| format!("cannot build extension: {}", e))?;
    builder
        .append_extension(ext)
        .map_err(|e| format!("cannot append extension: {}", e))
}

fn expiring(cert: &X509, within_days: u32) -> Result<bool, String> {
    let threshold = Asn1Time::days_from_now(within_days)
        .map_err(|e| format!("cannot compute renewal threshold: {}", e))?;

    Ok(cert
        .not_after()
        .compare(&threshold)
        .map_err(|e| format!("cannot read cert expiry: {}", e))?
        != Ordering::Greater)
}

fn read_cert(path: &Path) -> Result<X509, String> {
    let pem = fs::read(path).map_err(|e| format!("cannot read {:?}: {}", path, e))?;
    X509::from_pem(&pem).map_err(|e| format!("{:?} is not valid PEM: {}", path, e))
}

fn read_key(path: &Path) -> Result<PKey<Private>, String> {
    let pem = fs::read(path).map_err(|e| format!("cannot read {:?}: {}", path, e))?;
    PKey::private_key_from_pem(&pem).map_err(|e| format!("{:?} is not valid PEM: {}", path, e))
}

fn pem(cert: &X509) -> Result<Vec<u8>, String> {
    cert.to_pem()
        .map_err(|e| format!("cannot serialize cert: {}", e))
}

fn pem_key(key: &PKey<Private>) -> Result<Vec<u8>, String> {
    key.private_key_to_pem_pkcs8()
        .map_err(|e| format!("cannot serialize key: {}", e))
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

    fn scratch_proxy() -> (tempfile::TempDir, ProxyTls) {
        let dir = tempfile::tempdir().unwrap();
        let tls = ensure_proxy_at(dir.path().to_path_buf()).unwrap();
        (dir, tls)
    }

    fn chain(tls: &ProxyTls) -> Vec<X509> {
        X509::stack_from_pem(&fs::read(&tls.chain_path).unwrap()).unwrap()
    }

    fn sans(cert: &X509) -> Vec<String> {
        cert.subject_alt_names()
            .map(|names| {
                names
                    .iter()
                    .filter_map(|n| n.dnsname().map(str::to_string))
                    .collect()
            })
            .unwrap_or_default()
    }

    #[test]
    fn proxy_chain_covers_the_stack_domain_and_its_subdomains() {
        let (_dir, tls) = scratch_proxy();
        let chain = chain(&tls);

        assert_eq!(chain.len(), 2, "chain should be leaf + issuing CA");
        assert_eq!(
            sans(&chain[0]),
            vec!["stack.localhost", "*.stack.localhost"],
            "the dashboard sits on the bare domain, stacks on subdomains"
        );

        // leaf -> issuing CA -> anchor, all the way up.
        let issuer = read_cert(&tls.issuer_path).unwrap();
        let root = read_cert(&tls.root_path).unwrap();
        assert!(chain[0].verify(&issuer.public_key().unwrap()).unwrap());
        assert!(issuer.verify(&root.public_key().unwrap()).unwrap());
        assert!(root.verify(&root.public_key().unwrap()).unwrap());
    }

    #[test]
    fn the_anchor_key_is_never_written_to_disk() {
        let (dir, tls) = scratch_proxy();

        let keys: Vec<PathBuf> = fs::read_dir(dir.path())
            .unwrap()
            .map(|e| e.unwrap().path())
            .filter(|p| {
                fs::read(p)
                    .map(|b| String::from_utf8_lossy(&b).contains("PRIVATE KEY"))
                    .unwrap_or(false)
            })
            .collect();

        // Only the issuing CA and the leaf keep a key. The anchor's key is
        // dropped after signing, which is what makes it safe to trust.
        let root = read_cert(&tls.root_path).unwrap();
        let root_pub = root.public_key().unwrap();
        for path in &keys {
            let key = read_key(path).unwrap();
            assert!(
                !root_pub.public_eq(&key),
                "the anchor's private key was persisted at {:?}",
                path
            );
        }
        assert_eq!(keys.len(), 2, "keys on disk: {:?}", keys);
    }

    #[test]
    fn the_issuing_ca_cannot_vouch_for_anything_outside_the_stack_domain() {
        let (_dir, tls) = scratch_proxy();
        let issuer = read_cert(&tls.issuer_path).unwrap();
        let text = String::from_utf8(issuer.to_text().unwrap()).unwrap();

        // Critical, so a verifier that cannot enforce the limit must reject
        // the chain rather than quietly ignore it.
        assert!(text.contains("X509v3 Name Constraints: critical"), "{}", text);
        assert!(text.contains("DNS:stack.localhost"), "{}", text);
        assert!(text.contains("IP:0.0.0.0/0.0.0.0"), "{}", text);
        assert!(text.contains("pathlen:0"), "{}", text);
        assert!(text.contains("TLS Web Server Authentication"), "{}", text);

        // And the chain really is refused by a verifier: forge a certificate
        // for another host with the key that does live on disk.
        let issuer_key = read_key(&tls.issuer_key_path).unwrap();
        let forged = forge(&issuer, &issuer_key, "www.google.com");

        let mut store = openssl::x509::store::X509StoreBuilder::new().unwrap();
        store.add_cert(read_cert(&tls.root_path).unwrap()).unwrap();
        let store = store.build();

        let mut untrusted = openssl::stack::Stack::new().unwrap();
        untrusted.push(issuer.clone()).unwrap();

        let mut ctx = openssl::x509::X509StoreContext::new().unwrap();
        let accepted = ctx
            .init(&store, &forged, &untrusted, |c| c.verify_cert())
            .unwrap();
        assert!(!accepted, "a stolen issuing CA key must not reach other hosts");

        // The leaf it *is* allowed to issue still verifies.
        let leaf = chain(&tls).remove(0);
        let mut ctx = openssl::x509::X509StoreContext::new().unwrap();
        assert!(ctx
            .init(&store, &leaf, &untrusted, |c| c.verify_cert())
            .unwrap());
    }

    fn forge(issuer: &X509, issuer_key: &PKey<Private>, host: &str) -> X509 {
        let key = generate_key().unwrap();
        let name = subject(host, "forged").unwrap();

        let mut builder = openssl::x509::X509Builder::new().unwrap();
        builder.set_version(2).unwrap();
        builder.set_serial_number(&serial().unwrap()).unwrap();
        builder.set_subject_name(&name).unwrap();
        builder.set_issuer_name(issuer.subject_name()).unwrap();
        builder.set_pubkey(&key).unwrap();
        set_validity(&mut builder, 30).unwrap();
        append(&mut builder, BasicConstraints::new().critical().build()).unwrap();
        append(&mut builder, ExtendedKeyUsage::new().server_auth().build()).unwrap();

        let ctx = builder.x509v3_context(Some(issuer), None);
        let san = SubjectAlternativeName::new().dns(host).build(&ctx).unwrap();
        builder.append_extension(san).unwrap();

        builder.sign(issuer_key, MessageDigest::sha256()).unwrap();
        builder.build()
    }

    #[test]
    fn proxy_material_is_reused_across_launches() {
        let (dir, first) = scratch_proxy();
        let before = fs::read(&first.chain_path).unwrap();
        let anchor_before = fs::read(&first.root_path).unwrap();

        let second = ensure_proxy_at(dir.path().to_path_buf()).unwrap();

        assert!(first.anchor_is_new);
        assert!(
            !second.anchor_is_new,
            "re-trusting on every launch would train users to click through prompts"
        );
        assert_eq!(before, fs::read(&second.chain_path).unwrap());
        assert_eq!(anchor_before, fs::read(&second.root_path).unwrap());
    }

    #[test]
    fn a_leaf_from_a_superseded_authority_is_replaced() {
        let (dir, tls) = scratch_proxy();
        let stale = fs::read(&tls.chain_path).unwrap();

        // Simulate a rebuilt authority: drop the anchor, keep the old leaf.
        fs::remove_file(&tls.root_path).unwrap();
        let rebuilt = ensure_proxy_at(dir.path().to_path_buf()).unwrap();

        assert!(rebuilt.anchor_is_new);
        assert_ne!(stale, fs::read(&rebuilt.chain_path).unwrap());

        let issuer = read_cert(&rebuilt.issuer_path).unwrap();
        assert!(inspect_leaf(&rebuilt, &issuer).unwrap());
    }

    #[test]
    fn the_fingerprint_tracks_the_leaf() {
        let (dir, tls) = scratch_proxy();
        let before = tls.fingerprint().unwrap();

        assert_eq!(before.len(), 64, "sha-256, hex encoded");
        assert_eq!(
            before,
            ensure_proxy_at(dir.path().to_path_buf())
                .unwrap()
                .fingerprint()
                .unwrap(),
            "an unchanged certificate must not churn the proxy container"
        );

        // Rebuilt authority: new leaf, so the proxy has to be restarted on it.
        fs::remove_file(&tls.root_path).unwrap();
        let rebuilt = ensure_proxy_at(dir.path().to_path_buf()).unwrap();
        assert_ne!(before, rebuilt.fingerprint().unwrap());
    }

    #[cfg(unix)]
    #[test]
    fn proxy_keys_are_not_world_readable() {
        use std::os::unix::fs::PermissionsExt;

        let (_dir, tls) = scratch_proxy();

        for path in [&tls.key_path, &tls.issuer_key_path] {
            let mode = fs::metadata(path).unwrap().permissions().mode();
            assert_eq!(mode & 0o077, 0, "{:?} mode: {:o}", path, mode);
        }
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
