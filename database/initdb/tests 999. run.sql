DO $$
DECLARE
  v_result TEXT;
BEGIN
  SELECT result FROM unit_tests.begin() INTO v_result;
  -- PERFORM SELECT * FROM unit_tests.test_details;
  IF v_result <> 'Y' THEN
    RAISE EXCEPTION '🚨 Some unit tests did not pass.' using errcode = 'GWBID';
  END IF;
END; $$
LANGUAGE 'plpgsql';
