DROP SCHEMA IF EXISTS public CASCADE;
DROP SCHEMA IF EXISTS swag CASCADE;
CREATE SCHEMA public;
CREATE SCHEMA swag;
CREATE SCHEMA worker;
SET search_path TO swag, public;

-- Roles
CREATE ROLE default_role;
CREATE ROLE app_user;
CREATE ROLE admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA swag, public, worker GRANT ALL PRIVILEGES ON TABLES TO default_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA swag, public, worker GRANT ALL PRIVILEGES ON FUNCTIONS TO default_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA swag, public, worker GRANT USAGE          ON SEQUENCES TO default_role;
GRANT ALL ON SCHEMA swag, public, worker TO default_role;
GRANT USAGE ON SCHEMA swag, public, worker TO default_role;
GRANT default_role TO app_user;
GRANT app_user TO admin;
ALTER ROLE default_role SET search_path = swag, public;
ALTER ROLE app_user SET search_path = swag, public;
ALTER ROLE admin SET search_path = swag, public;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public; -- used for password encryption/decryption
CREATE EXTENSION CITEXT WITH SCHEMA public;
CREATE EXTENSION UNACCENT WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public; -- used for generating UUIDs for sessions
CREATE EXTENSION postgis WITH SCHEMA public; -- used for the geography type

-- Global functions
CREATE OR REPLACE FUNCTION set_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION soft_delete()
  RETURNS TRIGGER AS $$
  BEGIN
    DECLARE
      command text := ' SET deleted_at = current_timestamp WHERE id = $1';
    BEGIN
      EXECUTE 'UPDATE swag.' || TG_TABLE_NAME || command USING OLD.id;
      RETURN NULL;
    END;
  END;
$$ LANGUAGE 'plpgsql';
