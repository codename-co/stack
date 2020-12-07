--
-- ■ SUBSCRIPTIONS
--

-- USAGE EXAMPLES:
--
-- -- Global messages subscription / any update to any anyone's message will trigger the event to everyone
-- CREATE TRIGGER messages_subscription
--   AFTER INSERT OR UPDATE OR DELETE ON messages FOR EACH ROW
-- EXECUTE PROCEDURE public.notify_postgraphile('messages');
--
-- -- Per-recipient messages subscription / only updates to one's messages will trigger the event to this special someone
-- CREATE TRIGGER messages_subscription
--   AFTER INSERT OR UPDATE OR DELETE ON messages FOR EACH ROW
-- EXECUTE PROCEDURE public.graphql_subscription('messagesChanged', 'postgraphile:messages:$1', 'recipient_id');


-- Note: This part comes from Graphile documentation:
-- <https://www.graphile.org/postgraphile/subscriptions/>

CREATE FUNCTION public.graphql_subscription() RETURNS TRIGGER AS $$
DECLARE
  v_process_new bool = (TG_OP = 'INSERT' OR TG_OP = 'UPDATE');
  v_process_old bool = (TG_OP = 'UPDATE' OR TG_OP = 'DELETE');
  v_event TEXT = TG_ARGV[0];
  v_topic_template TEXT = TG_ARGV[1];
  v_attribute TEXT = TG_ARGV[2];
  v_record RECORD;
  v_sub TEXT;
  v_topic TEXT;
  v_i INT = 0;
  v_last_topic TEXT;
BEGIN
  -- On UPDATE sometimes topic may be changed for NEW record,
  -- so we need notify to both topics NEW and OLD.
  FOR v_i IN 0..1 LOOP
    IF (v_i = 0) AND v_process_new IS TRUE THEN
      v_record = new;
    ELSIF (v_i = 1) AND v_process_old IS TRUE THEN
      v_record = old;
    ELSE
      CONTINUE;
    END IF;
    IF v_attribute IS NOT NULL THEN
      EXECUTE 'select $1.' || quote_ident(v_attribute)
        USING v_record
        INTO v_sub;
    END IF;
    IF v_sub IS NOT NULL THEN
      v_topic = REPLACE(v_topic_template, '$1', v_sub);
    ELSE
      v_topic = v_topic_template;
    END IF;
    IF v_topic IS DISTINCT FROM v_last_topic THEN
      -- This if statement prevents us from triggering the same notification twice
      v_last_topic = v_topic;
      PERFORM pg_notify(v_topic, json_build_object(
        'event', v_event,
        'subject', v_sub
      )::TEXT);
    END IF;
  END LOOP;
  RETURN v_record;
END;
$$ LANGUAGE PLPGSQL VOLATILE SET search_path FROM CURRENT;

-- Custom:

CREATE FUNCTION public.notify_postgraphile()
  RETURNS TRIGGER AS $$
  DECLARE
    v_topic TEXT = TG_ARGV[0];
  BEGIN
    PERFORM pg_notify(CONCAT('postgraphile:', v_topic), '{}');
    RETURN NEW;
  END;
$$ LANGUAGE 'plpgsql';
