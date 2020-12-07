--
-- ■ MESSAGES
--

BEGIN;
  -- ⋯ Table prerequisites
  DROP TYPE IF EXISTS MESSAGE_TYPE;
  CREATE TYPE MESSAGE_TYPE AS ENUM (
    'custom',
    'welcome'
  );

  -- ✨ Table definition
  CREATE TABLE IF NOT EXISTS messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    recipient_id BIGINT REFERENCES swag.users(id) NOT NULL,
    type MESSAGE_TYPE DEFAULT 'custom',
    data JSONB,
    title TEXT,
    content TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  );

  -- ⚡ Indexes for increased performance
  CREATE INDEX messages_recipient_id ON messages (recipient_id);
  CREATE INDEX messages_type ON messages (type);
  CREATE INDEX messages_created_at ON messages (created_at);
  CREATE INDEX messages_deleted_at ON messages (deleted_at);

  -- 💪 Row-Level Security
  ALTER TABLE swag.messages ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS guests_cannot_access_messages ON swag.messages;
  CREATE POLICY guests_cannot_access_messages ON swag.messages
  FOR ALL TO default_role USING (FALSE);

  DROP POLICY IF EXISTS users_can_handle_their_own_messages ON swag.messages;
  CREATE POLICY users_can_handle_their_own_messages ON swag.messages
  FOR ALL TO app_user USING (
    recipient_id = swag.current_user_id()
  );

  DROP POLICY IF EXISTS users_can_create_new_messages ON swag.messages;
  CREATE POLICY users_can_create_new_messages ON swag.messages
  FOR INSERT TO app_user WITH CHECK (TRUE);

  DROP POLICY IF EXISTS admin_can_access_all_messages ON swag.messages;
  CREATE POLICY admin_can_access_all_messages ON swag.messages
  FOR ALL TO admin USING (TRUE);

  -- 🤖 Handle soft deletion
  CREATE TRIGGER messages_soft_delete
    BEFORE DELETE ON swag.messages FOR EACH ROW
  EXECUTE PROCEDURE soft_delete();

  -- 🤖 Subscribe to messages
  CREATE TRIGGER messages_subscription
    AFTER INSERT OR UPDATE OR DELETE ON swag.messages FOR EACH ROW
  EXECUTE PROCEDURE public.graphql_subscription('messagesChanged', 'postgraphile:messages:$1', 'recipient_id');

  -- 🤖 Subscribe to message
  CREATE TRIGGER message_subscription
    AFTER INSERT OR UPDATE OR DELETE ON swag.messages FOR EACH ROW
  EXECUTE PROCEDURE public.graphql_subscription('messageChanged', 'postgraphile:message:$1', 'id');

  -- 📖 Documentation
  COMMENT ON TABLE messages IS 'Messages';
  COMMENT ON COLUMN messages.id IS 'Message ID';
  COMMENT ON COLUMN messages.recipient_id IS 'Recipient';
  COMMENT ON COLUMN messages.type IS 'Type of the message';
  COMMENT ON COLUMN messages.type IS 'Type of the message';
  COMMENT ON COLUMN messages.data IS 'Custom data of the message (JSON)';
  COMMENT ON COLUMN messages.title IS 'The message title';
  COMMENT ON COLUMN messages.content IS 'The message content';
  COMMENT ON COLUMN messages.is_read IS 'Has the message been read?';
  COMMENT ON COLUMN messages.created_at IS 'Message creation date';
  COMMENT ON COLUMN messages.deleted_at IS 'Time of the message deletion';
COMMIT;
