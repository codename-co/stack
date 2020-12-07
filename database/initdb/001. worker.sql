--
-- ■ WORKER / JOB QUEUES
--

-- CREATE SCHEMA worker;
create table worker.migrations(
  id int primary key,
  ts timestamptz default now() not null
);
-- Allow installing migrations into existing schema
-- See: <https://github.com/graphile/worker/issues/132#issuecomment-684745754>
insert into worker.migrations (id) values (5);

-- Note: This part comes from Graphile Worker source:
-- <https://github.com/graphile/worker/blob/main/sql/000001.sql>

-- Create the tables
create table worker.job_queues (
  queue_name text not null primary key,
  job_count int not null,
  locked_at timestamptz,
  locked_by text
);
-- alter table worker.job_queues enable row level security;

create table worker.jobs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  queue_name text default (public.gen_random_uuid())::text not null,
  task_identifier text not null,
  payload json default '{}'::json not null,
  priority int default 0 not null,
  run_at timestamptz default now() not null,
  attempts int default 0 not null,
  max_attempts int default 25 not null,
  last_error text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
-- alter table worker.jobs enable row level security;

create index on worker.jobs (priority, run_at, id);

-- Keep updated_at up to date
create function worker.tg__update_timestamp() returns trigger as $$
begin
  new.updated_at = greatest(now(), old.updated_at + interval '1 millisecond');
  return new;
end;
$$ language plpgsql;
create trigger _100_timestamps before update on worker.jobs for each row execute procedure worker.tg__update_timestamp();

-- Manage the job_queues table - creating and deleting entries as appropriate
create function worker.jobs__decrease_job_queue_count() returns trigger as $$
declare
  v_new_job_count int;
begin
  update worker.job_queues
    set job_count = job_queues.job_count - 1
    where queue_name = old.queue_name
    returning job_count into v_new_job_count;

  if v_new_job_count <= 0 then
    delete from worker.job_queues where queue_name = old.queue_name and job_count <= 0;
  end if;

  return old;
end;
$$ language plpgsql;
create function worker.jobs__increase_job_queue_count() returns trigger as $$
begin
  insert into worker.job_queues(queue_name, job_count)
    values(new.queue_name, 1)
    on conflict (queue_name)
    do update
    set job_count = job_queues.job_count + 1;

  return new;
end;
$$ language plpgsql;
create trigger _500_increase_job_queue_count after insert on worker.jobs for each row execute procedure worker.jobs__increase_job_queue_count();
create trigger _500_decrease_job_queue_count after delete on worker.jobs for each row execute procedure worker.jobs__decrease_job_queue_count();
create trigger _500_increase_job_queue_count_update after update of queue_name on worker.jobs for each row execute procedure worker.jobs__increase_job_queue_count();
create trigger _500_decrease_job_queue_count_update after update of queue_name on worker.jobs for each row execute procedure worker.jobs__decrease_job_queue_count();

-- Notify worker of new jobs
create function worker.tg_jobs__notify_new_jobs() returns trigger as $$
begin
  perform pg_notify('jobs:insert', '');
  return new;
end;
$$ language plpgsql;
create trigger _900_notify_worker after insert on worker.jobs for each statement execute procedure worker.tg_jobs__notify_new_jobs();

-- Function to queue a job
create function worker.add_job(
  identifier text,
  payload json = '{}',
  queue_name text = public.gen_random_uuid()::text,
  run_at timestamptz = now(),
  max_attempts int = 25
) returns worker.jobs as $$
  insert into worker.jobs(task_identifier, payload, queue_name, run_at, max_attempts) values(identifier, payload, queue_name, run_at, max_attempts) returning *;
$$ language sql;

-- The main function - find me a job to do!
create function worker.get_job(worker_id text, task_identifiers text[] = null, job_expiry interval = interval '4 hours') returns worker.jobs as $$
declare
  v_job_id bigint;
  v_queue_name text;
  v_default_job_max_attempts text = '25';
  v_row worker.jobs;
begin
  if worker_id is null or length(worker_id) < 10 then
    raise exception 'invalid worker id';
  end if;

  select job_queues.queue_name, jobs.id into v_queue_name, v_job_id
    from worker.jobs
    inner join worker.job_queues using (queue_name)
    where (locked_at is null or locked_at < (now() - job_expiry))
    and run_at <= now()
    and attempts < max_attempts
    and (task_identifiers is null or task_identifier = any(task_identifiers))
    order by priority asc, run_at asc, id asc
    limit 1
    for update of job_queues
    skip locked;

  if v_queue_name is null then
    return null;
  end if;

  update worker.job_queues
    set
      locked_by = worker_id,
      locked_at = now()
    where job_queues.queue_name = v_queue_name;

  update worker.jobs
    set attempts = attempts + 1
    where id = v_job_id
    returning * into v_row;

  return v_row;
end;
$$ language plpgsql;

-- I was successful, mark the job as completed
create function worker.complete_job(worker_id text, job_id bigint) returns worker.jobs as $$
declare
  v_row worker.jobs;
begin
  delete from worker.jobs
    where id = job_id
    returning * into v_row;

  update worker.job_queues
    set locked_by = null, locked_at = null
    where queue_name = v_row.queue_name and locked_by = worker_id;

  return v_row;
end;
$$ language plpgsql;

-- I was unsuccessful, re-schedule the job please
create function worker.fail_job(worker_id text, job_id bigint, error_message text) returns worker.jobs as $$
declare
  v_row worker.jobs;
begin
  update worker.jobs
    set
      last_error = error_message,
      run_at = greatest(now(), run_at) + (exp(least(attempts, 10))::text || ' seconds')::interval
    where id = job_id
    returning * into v_row;

  update worker.job_queues
    set locked_by = null, locked_at = null
    where queue_name = v_row.queue_name and locked_by = worker_id;

  return v_row;
end;
$$ language plpgsql;

-- Note: This part comes from Graphile Worker source:
-- <https://github.com/graphile/worker/blob/main/sql/000002.sql>

alter table worker.jobs add column key text unique check(length(key) > 0);

alter table worker.jobs add locked_at timestamptz;
alter table worker.jobs add locked_by text;

-- update any in-flight jobs
update worker.jobs
  set locked_at = q.locked_at, locked_by = q.locked_by
  from worker.job_queues q
  where q.queue_name = jobs.queue_name
  and q.locked_at is not null;

-- update add_job behaviour to meet new requirements
drop function if exists worker.add_job(
  identifier text,
  payload json,
  queue_name text,
  run_at timestamptz,
  max_attempts int
);
create function worker.add_job(
  identifier text,
  payload json = '{}',
  queue_name text = null,
  run_at timestamptz = now(),
  max_attempts int = 25,
  job_key text = null
) returns worker.jobs as $$
declare
  v_job worker.jobs;
begin
  if job_key is not null then
    -- Upsert job
    insert into worker.jobs (task_identifier, payload, queue_name, run_at, max_attempts, key)
      values(
        identifier,
        payload,
        coalesce(queue_name, public.gen_random_uuid()::text),
        run_at,
        max_attempts,
        job_key
      )
      on conflict (key) do update set
        -- update all job details other than queue_name, which we want to keep
        -- the same unless explicitly provided
        task_identifier=excluded.task_identifier,
        payload=excluded.payload,
        queue_name=coalesce(add_job.queue_name, jobs.queue_name),
        max_attempts=excluded.max_attempts,
        run_at=excluded.run_at,

        -- always reset error/retry state
        attempts=0,
        last_error=null
      where jobs.locked_at is null
      returning *
      into v_job;

    -- If upsert succeeded (insert or update), return early
    if not (v_job is null) then
      return v_job;
    end if;

    -- Upsert failed -> there must be an existing job that is locked. Remove
    -- existing key to allow a new one to be inserted, and prevent any
    -- subsequent retries by bumping attempts to the max allowed.
    update worker.jobs
      set
        key = null,
        attempts = jobs.max_attempts
      where key = job_key;
  end if;

  -- insert the new job. Assume no conflicts due to the update above
  insert into worker.jobs(task_identifier, payload, queue_name, run_at, max_attempts, key)
    values(
      identifier,
      payload,
      coalesce(queue_name, public.gen_random_uuid()::text),
      run_at,
      max_attempts,
      job_key
    )
    returning *
    into v_job;

  return v_job;
end;
$$ language plpgsql volatile;

--- implement new remove_job function

create function worker.remove_job(
  job_key text
) returns worker.jobs as $$
  delete from worker.jobs
    where key = job_key
    and locked_at is null
  returning *;
$$ language sql strict volatile;

-- Update other functions to handle locked_at denormalisation

create or replace function worker.get_job(worker_id text, task_identifiers text[] = null, job_expiry interval = interval '4 hours') returns worker.jobs as $$
declare
  v_job_id bigint;
  v_queue_name text;
  v_row worker.jobs;
  v_now timestamptz = now();
begin
  if worker_id is null or length(worker_id) < 10 then
    raise exception 'invalid worker id';
  end if;

  select job_queues.queue_name, jobs.id into v_queue_name, v_job_id
    from worker.jobs
    inner join worker.job_queues using (queue_name)
    where (job_queues.locked_at is null or job_queues.locked_at < (v_now - job_expiry))
    and run_at <= v_now
    and attempts < max_attempts
    and (task_identifiers is null or task_identifier = any(task_identifiers))
    order by priority asc, run_at asc, id asc
    limit 1
    for update of job_queues
    skip locked;

  if v_queue_name is null then
    return null;
  end if;

  update worker.job_queues
    set
      locked_by = worker_id,
      locked_at = v_now
    where job_queues.queue_name = v_queue_name;

  update worker.jobs
    set
      attempts = attempts + 1,
      locked_by = worker_id,
      locked_at = v_now
    where id = v_job_id
    returning * into v_row;

  return v_row;
end;
$$ language plpgsql volatile;

-- I was unsuccessful, re-schedule the job please
create or replace function worker.fail_job(worker_id text, job_id bigint, error_message text) returns worker.jobs as $$
declare
  v_row worker.jobs;
begin
  update worker.jobs
    set
      last_error = error_message,
      run_at = greatest(now(), run_at) + (exp(least(attempts, 10))::text || ' seconds')::interval,
      locked_by = null,
      locked_at = null
    where id = job_id and locked_by = worker_id
    returning * into v_row;

  update worker.job_queues
    set locked_by = null, locked_at = null
    where queue_name = v_row.queue_name and locked_by = worker_id;

  return v_row;
end;
$$ language plpgsql volatile strict;

-- Note: This part comes from Graphile Worker source:
-- <https://github.com/graphile/worker/blob/main/sql/000003.sql>

alter table worker.jobs alter column queue_name drop not null;

create or replace function worker.add_job(
  identifier text,
  payload json = '{}',
  queue_name text = null,
  run_at timestamptz = now(),
  max_attempts int = 25,
  job_key text = null
) returns worker.jobs as $$
declare
  v_job worker.jobs;
begin
  if job_key is not null then
    -- Upsert job
    insert into worker.jobs (task_identifier, payload, queue_name, run_at, max_attempts, key)
      values(
        identifier,
        payload,
        queue_name,
        run_at,
        max_attempts,
        job_key
      )
      on conflict (key) do update set
        task_identifier=excluded.task_identifier,
        payload=excluded.payload,
        queue_name=excluded.queue_name,
        max_attempts=excluded.max_attempts,
        run_at=excluded.run_at,

        -- always reset error/retry state
        attempts=0,
        last_error=null
      where jobs.locked_at is null
      returning *
      into v_job;

    -- If upsert succeeded (insert or update), return early
    if not (v_job is null) then
      return v_job;
    end if;

    -- Upsert failed -> there must be an existing job that is locked. Remove
    -- existing key to allow a new one to be inserted, and prevent any
    -- subsequent retries by bumping attempts to the max allowed.
    update worker.jobs
      set
        key = null,
        attempts = jobs.max_attempts
      where key = job_key;
  end if;

  -- insert the new job. Assume no conflicts due to the update above
  insert into worker.jobs(task_identifier, payload, queue_name, run_at, max_attempts, key)
    values(
      identifier,
      payload,
      queue_name,
      run_at,
      max_attempts,
      job_key
    )
    returning *
    into v_job;

  return v_job;
end;
$$ language plpgsql volatile;

create or replace function worker.get_job(worker_id text, task_identifiers text[] = null, job_expiry interval = interval '4 hours') returns worker.jobs as $$
declare
  v_job_id bigint;
  v_queue_name text;
  v_row worker.jobs;
  v_now timestamptz = now();
begin
  if worker_id is null or length(worker_id) < 10 then
    raise exception 'invalid worker id';
  end if;

  select jobs.queue_name, jobs.id into v_queue_name, v_job_id
    from worker.jobs
    where (jobs.locked_at is null or jobs.locked_at < (v_now - job_expiry))
    and (
      jobs.queue_name is null
    or
      exists (
        select 1
        from worker.job_queues
        where job_queues.queue_name = jobs.queue_name
        and (job_queues.locked_at is null or job_queues.locked_at < (v_now - job_expiry))
        for update
        skip locked
      )
    )
    and run_at <= v_now
    and attempts < max_attempts
    and (task_identifiers is null or task_identifier = any(task_identifiers))
    order by priority asc, run_at asc, id asc
    limit 1
    for update
    skip locked;

  if v_job_id is null then
    return null;
  end if;

  if v_queue_name is not null then
    update worker.job_queues
      set
        locked_by = worker_id,
        locked_at = v_now
      where job_queues.queue_name = v_queue_name;
  end if;

  update worker.jobs
    set
      attempts = attempts + 1,
      locked_by = worker_id,
      locked_at = v_now
    where id = v_job_id
    returning * into v_row;

  return v_row;
end;
$$ language plpgsql volatile;

create or replace function worker.fail_job(worker_id text, job_id bigint, error_message text) returns worker.jobs as $$
declare
  v_row worker.jobs;
begin
  update worker.jobs
    set
      last_error = error_message,
      run_at = greatest(now(), run_at) + (exp(least(attempts, 10))::text || ' seconds')::interval,
      locked_by = null,
      locked_at = null
    where id = job_id and locked_by = worker_id
    returning * into v_row;

  if v_row.queue_name is not null then
    update worker.job_queues
      set locked_by = null, locked_at = null
      where queue_name = v_row.queue_name and locked_by = worker_id;
  end if;

  return v_row;
end;
$$ language plpgsql volatile strict;

create or replace function worker.complete_job(worker_id text, job_id bigint) returns worker.jobs as $$
declare
  v_row worker.jobs;
begin
  delete from worker.jobs
    where id = job_id
    returning * into v_row;

  if v_row.queue_name is not null then
    update worker.job_queues
      set locked_by = null, locked_at = null
      where queue_name = v_row.queue_name and locked_by = worker_id;
  end if;

  return v_row;
end;
$$ language plpgsql;

drop trigger _500_increase_job_queue_count on worker.jobs;
drop trigger _500_decrease_job_queue_count on worker.jobs;
drop trigger _500_increase_job_queue_count_update on worker.jobs;
drop trigger _500_decrease_job_queue_count_update on worker.jobs;
create trigger _500_increase_job_queue_count after insert on worker.jobs for each row when (NEW.queue_name is not null) execute procedure worker.jobs__increase_job_queue_count();
create trigger _500_decrease_job_queue_count after delete on worker.jobs for each row when (OLD.queue_name is not null) execute procedure worker.jobs__decrease_job_queue_count();
create trigger _500_increase_job_queue_count_update after update of queue_name on worker.jobs for each row when (NEW.queue_name is distinct from OLD.queue_name AND NEW.queue_name is not null) execute procedure worker.jobs__increase_job_queue_count();
create trigger _500_decrease_job_queue_count_update after update of queue_name on worker.jobs for each row when (NEW.queue_name is distinct from OLD.queue_name AND OLD.queue_name is not null) execute procedure worker.jobs__decrease_job_queue_count();

-- Note: This part comes from Graphile Worker source:
-- <https://github.com/graphile/worker/blob/main/sql/000004.sql>

drop function worker.add_job(text, json, text, timestamptz, int, text);

create function worker.add_job(
  identifier text,
  payload json = null,
  queue_name text = null,
  run_at timestamptz = null,
  max_attempts int = null,
  job_key text = null,
  priority int = null
) returns worker.jobs as $$
declare
  v_job worker.jobs;
begin
  -- Apply rationality checks
  if length(identifier) > 128 then
    raise exception 'Task identifier is too long (max length: 128).' using errcode = 'GWBID';
  end if;
  if queue_name is not null and length(queue_name) > 128 then
    raise exception 'Job queue name is too long (max length: 128).' using errcode = 'GWBQN';
  end if;
  if job_key is not null and length(job_key) > 512 then
    raise exception 'Job key is too long (max length: 512).' using errcode = 'GWBJK';
  end if;
  if max_attempts < 1 then
    raise exception 'Job maximum attempts must be at least 1' using errcode = 'GWBMA';
  end if;

  if job_key is not null then
    -- Upsert job
    insert into worker.jobs (
      task_identifier,
      payload,
      queue_name,
      run_at,
      max_attempts,
      key,
      priority
    )
      values(
        identifier,
        coalesce(payload, '{}'::json),
        queue_name,
        coalesce(run_at, now()),
        coalesce(max_attempts, 25),
        job_key,
        coalesce(priority, 0)
      )
      on conflict (key) do update set
        task_identifier=excluded.task_identifier,
        payload=excluded.payload,
        queue_name=excluded.queue_name,
        max_attempts=excluded.max_attempts,
        run_at=excluded.run_at,
        priority=excluded.priority,

        -- always reset error/retry state
        attempts=0,
        last_error=null
      where jobs.locked_at is null
      returning *
      into v_job;

    -- If upsert succeeded (insert or update), return early
    if not (v_job is null) then
      return v_job;
    end if;

    -- Upsert failed -> there must be an existing job that is locked. Remove
    -- existing key to allow a new one to be inserted, and prevent any
    -- subsequent retries by bumping attempts to the max allowed.
    update worker.jobs
      set
        key = null,
        attempts = jobs.max_attempts
      where key = job_key;
  end if;

  -- insert the new job. Assume no conflicts due to the update above
  insert into worker.jobs(
    task_identifier,
    payload,
    queue_name,
    run_at,
    max_attempts,
    key,
    priority
  )
    values(
      identifier,
      coalesce(payload, '{}'::json),
      queue_name,
      coalesce(run_at, now()),
      coalesce(max_attempts, 25),
      job_key,
      coalesce(priority, 0)
    )
    returning *
    into v_job;

  return v_job;
end;
$$ language plpgsql volatile;

create function worker.complete_jobs(
  job_ids bigint[]
) returns setof worker.jobs as $$
  delete from worker.jobs
    where id = any(job_ids)
    and (
      locked_by is null
    or
      locked_at < NOW() - interval '4 hours'
    )
    returning *;
$$ language sql volatile;

create function worker.permanently_fail_jobs(
  job_ids bigint[],
  error_message text = null
) returns setof worker.jobs as $$
  update worker.jobs
    set
      last_error = coalesce(error_message, 'Manually marked as failed'),
      attempts = max_attempts
    where id = any(job_ids)
    and (
      locked_by is null
    or
      locked_at < NOW() - interval '4 hours'
    )
    returning *;
$$ language sql volatile;

create function worker.reschedule_jobs(
  job_ids bigint[],
  run_at timestamptz = null,
  priority int = null,
  attempts int = null,
  max_attempts int = null
) returns setof worker.jobs as $$
  update worker.jobs
    set
      run_at = coalesce(reschedule_jobs.run_at, jobs.run_at),
      priority = coalesce(reschedule_jobs.priority, jobs.priority),
      attempts = coalesce(reschedule_jobs.attempts, jobs.attempts),
      max_attempts = coalesce(reschedule_jobs.max_attempts, jobs.max_attempts)
    where id = any(job_ids)
    and (
      locked_by is null
    or
      locked_at < NOW() - interval '4 hours'
    )
    returning *;
$$ language sql volatile;

-- Note: This part comes from Graphile Worker source:
-- <https://github.com/graphile/worker/blob/main/sql/000005.sql>

alter table worker.jobs add column revision int default 0 not null;
alter table worker.jobs add column flags jsonb default null;

drop function worker.add_job(text, json, text, timestamptz, int, text, int);
create function worker.add_job(
  identifier text,
  payload json = null,
  queue_name text = null,
  run_at timestamptz = null,
  max_attempts int = null,
  job_key text = null,
  priority int = null,
  flags text[] = null
) returns worker.jobs as $$
declare
  v_job worker.jobs;
begin
  -- Apply rationality checks
  if length(identifier) > 128 then
    raise exception 'Task identifier is too long (max length: 128).' using errcode = 'GWBID';
  end if;
  if queue_name is not null and length(queue_name) > 128 then
    raise exception 'Job queue name is too long (max length: 128).' using errcode = 'GWBQN';
  end if;
  if job_key is not null and length(job_key) > 512 then
    raise exception 'Job key is too long (max length: 512).' using errcode = 'GWBJK';
  end if;
  if max_attempts < 1 then
    raise exception 'Job maximum attempts must be at least 1' using errcode = 'GWBMA';
  end if;

  if job_key is not null then
    -- Upsert job
    insert into worker.jobs (
      task_identifier,
      payload,
      queue_name,
      run_at,
      max_attempts,
      key,
      priority,
      flags
    )
      values(
        identifier,
        coalesce(payload, '{}'::json),
        queue_name,
        coalesce(run_at, now()),
        coalesce(max_attempts, 25),
        job_key,
        coalesce(priority, 0),
        (
          select jsonb_object_agg(flag, true)
          from unnest(flags) as item(flag)
        )
      )
      on conflict (key) do update set
        task_identifier=excluded.task_identifier,
        payload=excluded.payload,
        queue_name=excluded.queue_name,
        max_attempts=excluded.max_attempts,
        run_at=excluded.run_at,
        priority=excluded.priority,
        revision=jobs.revision + 1,
        flags=excluded.flags,

        -- always reset error/retry state
        attempts=0,
        last_error=null
      where jobs.locked_at is null
      returning *
      into v_job;

    -- If upsert succeeded (insert or update), return early
    if not (v_job is null) then
      return v_job;
    end if;

    -- Upsert failed -> there must be an existing job that is locked. Remove
    -- existing key to allow a new one to be inserted, and prevent any
    -- subsequent retries by bumping attempts to the max allowed.
    update worker.jobs
      set
        key = null,
        attempts = jobs.max_attempts
      where key = job_key;
  end if;

  -- insert the new job. Assume no conflicts due to the update above
  insert into worker.jobs(
    task_identifier,
    payload,
    queue_name,
    run_at,
    max_attempts,
    key,
    priority,
    flags
  )
    values(
      identifier,
      coalesce(payload, '{}'::json),
      queue_name,
      coalesce(run_at, now()),
      coalesce(max_attempts, 25),
      job_key,
      coalesce(priority, 0),
      (
        select jsonb_object_agg(flag, true)
        from unnest(flags) as item(flag)
      )
    )
    returning *
    into v_job;

  return v_job;
end;
$$ language plpgsql volatile;

drop function worker.get_job(text, text[], interval);
create function worker.get_job(
  worker_id text,
  task_identifiers text[] = null,
  job_expiry interval = interval '4 hours',
  forbidden_flags text[] = null
) returns worker.jobs as $$
declare
  v_job_id bigint;
  v_queue_name text;
  v_row worker.jobs;
  v_now timestamptz = now();
begin
  if worker_id is null or length(worker_id) < 10 then
    raise exception 'invalid worker id';
  end if;

  select jobs.queue_name, jobs.id into v_queue_name, v_job_id
    from worker.jobs
    where (jobs.locked_at is null or jobs.locked_at < (v_now - job_expiry))
    and (
      jobs.queue_name is null
    or
      exists (
        select 1
        from worker.job_queues
        where job_queues.queue_name = jobs.queue_name
        and (job_queues.locked_at is null or job_queues.locked_at < (v_now - job_expiry))
        for update
        skip locked
      )
    )
    and run_at <= v_now
    and attempts < max_attempts
    and (task_identifiers is null or task_identifier = any(task_identifiers))
    and (forbidden_flags is null or (flags ?| forbidden_flags) is not true)
    order by priority asc, run_at asc, id asc
    limit 1
    for update
    skip locked;

  if v_job_id is null then
    return null;
  end if;

  if v_queue_name is not null then
    update worker.job_queues
      set
        locked_by = worker_id,
        locked_at = v_now
      where job_queues.queue_name = v_queue_name;
  end if;

  update worker.jobs
    set
      attempts = attempts + 1,
      locked_by = worker_id,
      locked_at = v_now
    where id = v_job_id
    returning * into v_row;

  return v_row;
end;
$$ language plpgsql volatile;

-- CUSTOM

CREATE FUNCTION trigger_job() RETURNS trigger AS $$
BEGIN
  PERFORM worker.add_job(TG_ARGV[0], json_build_object(
    'schema', TG_TABLE_SCHEMA,
    'table', TG_TABLE_NAME,
    'op', TG_OP,
    'id', (CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END)
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;
