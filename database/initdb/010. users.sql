--
-- ■ USERS
--

BEGIN;
  -- ⋯ Table prerequisites
  DROP TYPE IF EXISTS USER_REGISTRATION_STATUS;
  CREATE TYPE USER_REGISTRATION_STATUS AS ENUM ('unconfirmed', 'confirmed');

  -- ✨ Table definition
  CREATE TABLE IF NOT EXISTS swag.users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email CITEXT UNIQUE NOT NULL,
    encrypted_password TEXT NOT NULL,
    registration_status USER_REGISTRATION_STATUS NOT NULL DEFAULT 'unconfirmed',
    confirmation_token TEXT DEFAULT MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text) NOT NULL UNIQUE,
    confirmed_at TIMESTAMPTZ,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    phone TEXT,
    address_line1 TEXT,
    postcode TEXT,
    city TEXT,
    birth_date DATE,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  );

  -- ⚡ Indexes for increased performance
  CREATE INDEX users_email ON swag.users (email);
  CREATE INDEX users_registration_status ON swag.users (registration_status);
  CREATE INDEX users_created_at ON swag.users (created_at);
  CREATE INDEX users_updated_at ON swag.users (updated_at);
  CREATE INDEX users_deleted_at ON swag.users (deleted_at);

  -- ✨ Handle a computed address column, auto-injected into the "users" node at GraphQL-time
  CREATE OR REPLACE FUNCTION users_address(u users) RETURNS TEXT AS $$
    SELECT CONCAT_WS(' ', address_line1, postcode, city) FROM swag.users WHERE swag.users.id = u.id;
  $$ LANGUAGE SQL STABLE;

  -- 🦸‍♂️ User session handling
  CREATE OR REPLACE FUNCTION swag.current_user_id()
    RETURNS BIGINT AS $$
      SELECT NULLIF(current_setting('jwt.claims.person_id', TRUE), '')::BIGINT;
  $$ LANGUAGE SQL STABLE;

  -- 💪 Row-Level Security
  ALTER TABLE swag.users ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS guests_cannot_access_user_accounts ON swag.users;
  CREATE POLICY guests_cannot_access_user_accounts ON swag.users
  FOR ALL TO default_role USING (FALSE);

  DROP POLICY IF EXISTS users_can_handle_their_own_user_account ON swag.users;
  CREATE POLICY users_can_handle_their_own_user_account ON swag.users
  FOR ALL TO app_user USING (
    id = swag.current_user_id()
  );

  DROP POLICY IF EXISTS admin_can_access_all_user_accounts ON swag.users;
  CREATE POLICY admin_can_access_all_user_accounts ON swag.users
  FOR ALL TO admin USING (TRUE);

  -- 🤖 Make sure that the `users.updated_at` column is consistent with the time of the latest edit
  CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON swag.users FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at_column();

  -- 🤖 Handle soft deletion
  CREATE TRIGGER users_soft_delete
    BEFORE DELETE ON swag.users FOR EACH ROW
  EXECUTE PROCEDURE soft_delete();

  -- 📖 Documentation
  COMMENT ON TABLE swag.users IS 'Users of the swag service';
  COMMENT ON COLUMN swag.users.id IS 'User ID';
  COMMENT ON COLUMN swag.users.email IS 'User email address';
  COMMENT ON COLUMN swag.users.encrypted_password IS 'User encrypted password';
  COMMENT ON COLUMN swag.users.registration_status IS 'User account registration status (either unconfirmed or confirmed)';
  COMMENT ON COLUMN swag.users.confirmation_token IS 'Confirmation token used in the account confirmation flow';
  COMMENT ON COLUMN swag.users.confirmed_at IS 'Time when the user account has been confirmed by email';
  COMMENT ON COLUMN swag.users.first_name IS 'The user first name';
  COMMENT ON COLUMN swag.users.last_name IS 'The user last name';
  COMMENT ON COLUMN swag.users.company_name IS 'The name of the user''s company';
  COMMENT ON COLUMN swag.users.phone IS 'The user phone number';
  COMMENT ON COLUMN swag.users.address_line1 IS 'The user address (first line)';
  COMMENT ON COLUMN swag.users.postcode IS 'The user postcode address';
  COMMENT ON COLUMN swag.users.city IS 'The user city address';
  COMMENT ON COLUMN swag.users.birth_date IS 'The user date of birth';
  COMMENT ON COLUMN swag.users.url IS 'The use phone number';
  COMMENT ON COLUMN swag.users.created_at IS 'User sign up date';
  COMMENT ON COLUMN swag.users.updated_at IS 'Time of the latest edit';
  COMMENT ON COLUMN swag.users.deleted_at IS 'Time of the user account deletion';

  -- ▶️ Queries & mutations

  DROP TYPE IF EXISTS swag.USER_SIGN_UP_RETURN CASCADE;
  CREATE TYPE swag.USER_SIGN_UP_RETURN AS (id int, confirmation_token TEXT);
  CREATE OR REPLACE FUNCTION user_sign_up(email TEXT, password TEXT)
    RETURNS swag.USER_SIGN_UP_RETURN AS $$
      INSERT INTO swag.users (email, encrypted_password)
      VALUES ($1, crypt($2, gen_salt('bf', 8)))
      RETURNING (id, confirmation_token)::swag.USER_SIGN_UP_RETURN;
    $$ LANGUAGE SQL;

  CREATE OR REPLACE FUNCTION user_change_pass(email TEXT, old_password TEXT, new_password TEXT)
    RETURNS BIGINT AS $$
      UPDATE swag.users SET encrypted_password = crypt($3, gen_salt('bf', 8))
      WHERE email = $1 AND encrypted_password = crypt($2, encrypted_password)
      RETURNING id;
    $$ LANGUAGE SQL;

  CREATE OR REPLACE FUNCTION user_change_pass_by_token(confirmation_token TEXT, new_password TEXT)
    RETURNS BIGINT AS $$
      UPDATE swag.users SET encrypted_password = crypt($2, gen_salt('bf', 8))
      WHERE confirmation_token = $1
      RETURNING id;
    $$ LANGUAGE SQL;

  CREATE OR REPLACE FUNCTION user_auth(email TEXT, password TEXT)
    RETURNS TABLE (id BIGINT, email CITEXT, first_name TEXT) AS $$
      SELECT id, email, first_name
      FROM swag.users
      WHERE email = $1
        AND encrypted_password = crypt($2, encrypted_password);
    $$ LANGUAGE SQL;

  CREATE OR REPLACE FUNCTION user_confirm_registration(email TEXT)
    RETURNS BIGINT AS $$
      UPDATE swag.users
      SET registration_status = 'confirmed', confirmed_at = NOW()
      WHERE email = $1 AND registration_status != 'confirmed'
      RETURNING id;
    $$ LANGUAGE SQL;

  CREATE OR REPLACE FUNCTION user_forgot_pass(email TEXT)
    RETURNS VOID AS $$
      SELECT worker.add_job('send_password_recovery_email',
        json_build_object(
          'email', $1
        )
      );
    $$ LANGUAGE SQL;

  CREATE OR REPLACE FUNCTION swag.current_user()
    RETURNS swag.users AS $$
      SELECT *
      FROM swag.users
      WHERE id = (SELECT swag.current_user_id());
  $$ LANGUAGE SQL STABLE;

  CREATE OR REPLACE FUNCTION is_authenticated()
    RETURNS BOOLEAN AS $$
      SELECT (id IS NOT NULL) AS authenticated FROM swag.current_user();
  $$ LANGUAGE SQL STABLE;

  COMMENT ON FUNCTION swag.current_user() is 'Gets the user who was identified by our JWT.';
COMMIT;


--
-- 🤖 AUTOMATION
--

BEGIN;
  CREATE OR REPLACE FUNCTION swag.welcome_the_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      -- send a message
      INSERT INTO swag.messages(recipient_id, type)
      VALUES (NEW.id, 'welcome');
      RETURN NEW;
    END;
  $$ LANGUAGE 'plpgsql';

  CREATE TRIGGER welcome_the_new_user
    AFTER INSERT ON swag.users FOR EACH ROW
  EXECUTE PROCEDURE swag.welcome_the_new_user();

  -- Email that the account has been created successfully
  CREATE TRIGGER send_verification_email
    AFTER INSERT ON swag.users
    FOR EACH ROW
    WHEN (NEW.registration_status = 'unconfirmed'
      AND NEW.email NOT LIKE '%@swag.lol')
  EXECUTE PROCEDURE trigger_job('send_verification_email');

  -- Email that the password has been changed successfully
  CREATE TRIGGER send_password_recovery_confirmation_email
    AFTER UPDATE OF encrypted_password ON swag.users
    FOR EACH ROW
  EXECUTE PROCEDURE trigger_job('send_password_recovery_confirmation_email');
COMMIT;
