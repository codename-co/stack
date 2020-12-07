CREATE OR REPLACE FUNCTION unit_tests.guests_cannot_access_messages() RETURNS test_result AS $$
DECLARE message test_result;
DECLARE result boolean;
DECLARE actual integer;
DECLARE expected integer;
BEGIN
  SET LOCAL role TO default_role;

  expected := 0;
  SELECT COUNT(*) FROM swag.messages INTO actual;

  SELECT * FROM assert.is_equal(actual, expected) INTO message, result;

  -- Check if test failed
  IF result = false THEN
    RETURN message;
  END IF;

  -- Otherwise test passed
  SELECT assert.ok('Test passed.') INTO message;
  RETURN message;
END
$$
LANGUAGE plpgsql;

-- 📖 Documentation
COMMENT ON FUNCTION unit_tests.guests_cannot_access_messages () IS 'Ensure a guest user has no access to the messages.';


CREATE OR REPLACE FUNCTION unit_tests.users_can_handle_their_own_messages() RETURNS test_result AS $$
DECLARE message test_result;
DECLARE result boolean;
DECLARE actual integer;
DECLARE expected integer;
BEGIN
  SET LOCAL role TO app_user;
  SET LOCAL jwt.claims.person_id TO 2;

  SELECT id FROM swag.messages WHERE recipient_id = swag.current_user_id() INTO expected;
  SELECT id FROM swag.messages INTO actual;

  SELECT * FROM assert.is_equal(actual, expected) INTO message, result;

  -- Check if test failed
  IF result = false THEN
    RETURN message;
  END IF;

  -- Otherwise test passed
  SELECT assert.ok('Test passed.') INTO message;
  RETURN message;
END
$$
LANGUAGE plpgsql;

-- 📖 Documentation
COMMENT ON FUNCTION unit_tests.users_can_handle_their_own_messages () IS 'Ensure a user only has access to its own messages.';
