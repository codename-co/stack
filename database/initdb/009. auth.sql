-- JSON Web Token
-- inspired by: https://github.com/PierreRochard/pgjwt [MIT license]
BEGIN;
  CREATE OR REPLACE FUNCTION url_encode(data bytea)
    RETURNS text LANGUAGE SQL AS $$
      SELECT translate(encode(data, 'base64'), E'+/=\n', '-_');
    $$;

  -- 📖 Documentation
  COMMENT ON FUNCTION url_encode (BYTEA) IS 'Encode an URL.';

  CREATE OR REPLACE FUNCTION url_decode(data text)
    RETURNS bytea LANGUAGE SQL AS $$
      WITH t AS (SELECT translate(data, '-_', '+/')),
          rem AS (SELECT length((SELECT * FROM t)) % 4) -- compute padding size
      SELECT decode(
        (SELECT * FROM t) ||
        CASE WHEN (SELECT * FROM rem) > 0
          THEN repeat('=', (4 - (SELECT * FROM rem)))
          ELSE '' END,
      'base64');
    $$;

  -- 📖 Documentation
  COMMENT ON FUNCTION url_decode (TEXT) IS 'Decode an URL.';

  -- Handle jwt tokens
  -- See: <https://www.graphile.org/postgraphile/security/#generating-jwts>
  DROP TYPE IF EXISTS jwt_token;
  CREATE TYPE jwt_token AS (
    role TEXT,
    exp INTEGER,
    person_id INTEGER,
    is_admin BOOLEAN,
    is_user BOOLEAN,
    username VARCHAR
  );

  CREATE OR REPLACE FUNCTION algorithm_sign(signables text, secret text, algorithm text)
    RETURNS text LANGUAGE SQL AS $$
      WITH alg AS (
        SELECT CASE
          WHEN algorithm = 'HS256' THEN 'sha256'
          WHEN algorithm = 'HS384' THEN 'sha384'
          WHEN algorithm = 'HS512' THEN 'sha512'
          ELSE '' END -- hmac throws error
      )
      SELECT url_encode(hmac(signables, secret, (SELECT * FROM alg)));
    $$;

  -- 📖 Documentation
  COMMENT ON FUNCTION algorithm_sign (TEXT, TEXT, TEXT) IS 'Sign using a specific algorithm.';

  CREATE OR REPLACE FUNCTION jwt_sign(payload json, secret text, algorithm text DEFAULT 'HS256')
    RETURNS text LANGUAGE SQL AS $$
      WITH header AS (
        SELECT url_encode(convert_to('{"alg":"' || algorithm || '","typ":"JWT"}', 'utf8'))
      ),
      payload AS (
        SELECT url_encode(convert_to(payload::text, 'utf8'))
      ),
      signables AS (
        SELECT (SELECT * FROM header) || '.' || (SELECT * FROM payload)
      )
      SELECT (SELECT * FROM signables) || '.' || algorithm_sign((SELECT * FROM signables), secret, algorithm);
    $$;

  -- 📖 Documentation
  COMMENT ON FUNCTION jwt_sign (JSON, TEXT, TEXT) IS 'Sign a JSON Web Token.';

  CREATE OR REPLACE FUNCTION jwt_verify(token text, secret text, algorithm text DEFAULT 'HS256')
    RETURNS table(header json, payload json, valid boolean) LANGUAGE SQL AS $$
      SELECT
        convert_from(url_decode(r[1]), 'utf8')::json AS header,
        convert_from(url_decode(r[2]), 'utf8')::json AS payload,
        r[3] = algorithm_sign(r[1] || '.' || r[2], secret, algorithm) AS valid
      FROM regexp_split_to_array(token, '\.') r;
    $$;

  -- 📖 Documentation
  COMMENT ON FUNCTION jwt_verify (TEXT, TEXT, TEXT) IS 'Verify a JSON Web Token.';
COMMIT;
