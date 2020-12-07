--
-- ■ ROLES
--

BEGIN;
  -- ⋯ Table prerequisites
  DROP TYPE IF EXISTS ROLE_TYPE;
  CREATE TYPE ROLE_TYPE AS ENUM ('user', 'admin');
COMMIT;

--
-- ■ USERS ROLES
--

BEGIN;
  -- ✨ Table definition
  CREATE TABLE IF NOT EXISTS users_roles (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT REFERENCES swag.users(id) NOT NULL,
    role ROLE_TYPE NOT NULL
  );

  -- ⚡ Indexes for increased performance
  CREATE INDEX users_roles_user_id ON users_roles (user_id);

  -- 📖 Documentation
  COMMENT ON TABLE users_roles IS 'Users/roles correspondence table';
  COMMENT ON COLUMN users_roles.id IS 'User role ID';
  COMMENT ON COLUMN users_roles.user_id IS 'Reference to the user';
  COMMENT ON COLUMN users_roles.role IS 'Role';

  -- ▶️ Queries & mutations

  CREATE OR REPLACE FUNCTION user_set_role(email TEXT, role ROLE_TYPE)
    RETURNS BIGINT AS $$
      INSERT INTO users_roles VALUES (DEFAULT,
        (SELECT id FROM swag.users WHERE email = $1),
        $2
      )
      RETURNING id;
    $$ LANGUAGE SQL;

  CREATE OR REPLACE FUNCTION user_sign_up_with_roles(email TEXT, password TEXT, roles ROLE_TYPE[])
    RETURNS VOID AS $$
    DECLARE
      query swag.USER_SIGN_UP_RETURN;
      role ROLE_TYPE;
    BEGIN
      -- 1. create the account
      query := (SELECT swag.user_sign_up($1, $2));
      -- 2. associate roles
      FOREACH role IN ARRAY $3 LOOP
        PERFORM user_set_role($1, role);
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
COMMIT;

--
-- ■ USERS VIEW
--

BEGIN;
  -- ✨ View definition
  CREATE OR REPLACE VIEW users_view AS
    SELECT
      u.*,
      array_agg(rel.role) roles,
      array_agg(rel.role) @> '{user}' is_user,
      array_agg(rel.role) @> '{admin}' is_admin
    FROM swag.users u
    LEFT JOIN users_roles rel
    ON rel.user_id = u.id
    GROUP BY u.id
    ORDER BY u.id;

  -- 📖 Documentation
  COMMENT ON VIEW users_view IS 'Enriched users table view, with roles';
COMMIT;

--
-- ■ USER AUTHENTICATION
--

BEGIN;
  -- Authenticate a user
  -- See: <https://www.graphile.org/postgraphile/security/#generating-jwts>
  CREATE OR REPLACE FUNCTION authenticate_raw(
    email TEXT,
    password TEXT
  ) RETURNS jwt_token AS $$
  DECLARE
    account users_view;
  BEGIN
    SELECT a.* INTO account
      FROM swag.users_view AS a
      WHERE a.email = authenticate_raw.email;

    IF account.encrypted_password = crypt(password, account.encrypted_password) THEN
      RETURN (
        (SELECT CASE
          WHEN account.is_admin THEN 'admin'
          ELSE 'app_user' END),
        extract(epoch FROM NOW() + INTERVAL '7 days'),
        account.id,
        account.is_admin,
        account.is_user,
        account.email
      )::jwt_token;
    ELSE
      RETURN NULL;
    END IF;
  END;
  $$ LANGUAGE plpgsql STRICT SECURITY DEFINER;

  -- Authenticate a user
  CREATE OR REPLACE FUNCTION authenticate(
    email TEXT,
    password TEXT
  ) RETURNS TEXT AS $$
    SELECT jwt_sign(to_json(authenticate_raw(email, password)), 'swagsecret'); -- TODO: use the JWT SECRET
  $$ LANGUAGE SQL STRICT SECURITY DEFINER;
  COMMENT ON FUNCTION authenticate(text, text) IS E'@resultFieldName token';

  CREATE OR REPLACE FUNCTION is_current_user_user()
    RETURNS BOOLEAN AS $$
      SELECT array_agg(rel.role) @> '{user}' FROM swag.current_user() u, swag.users_roles rel
      WHERE u.id = rel.user_id;
  $$ LANGUAGE SQL STABLE;

  CREATE OR REPLACE FUNCTION is_current_user_admin()
    RETURNS BOOLEAN AS $$
      SELECT array_agg(rel.role) @> '{admin}' FROM swag.current_user() u, swag.users_roles rel
      WHERE u.id = rel.user_id;
  $$ LANGUAGE SQL STABLE;
COMMIT;
