--
-- ■ GLOBAL PARAMETERS
--

BEGIN;
  -- ✨ Table definition
  CREATE TABLE IF NOT EXISTS parameters (
    name TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    description TEXT
  );

  -- 📖 Documentation
  COMMENT ON TABLE parameters IS 'Global parameters';
  COMMENT ON COLUMN parameters.value IS 'Parameter value';
  COMMENT ON COLUMN parameters.description IS 'Parameter description';

  CREATE OR REPLACE FUNCTION param(
    name TEXT
  )
    RETURNS TEXT AS $$
      SELECT value
      FROM swag.parameters
      WHERE name = $1;
    $$ LANGUAGE SQL STABLE;

  -- 📖 Documentation
  COMMENT ON FUNCTION param (TEXT) IS 'Get a parameter value by name.';
COMMIT;
