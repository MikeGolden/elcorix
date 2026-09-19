-- Gives Umami its own login role and database inside the existing Postgres
-- (docker-compose.yml → umami-db-init). Idempotent: runs on every
-- `docker compose up` and also re-applies UMAMI_DB_PASSWORD, so rotating
-- the password in .env is enough.
--
--   psql -h db -U kosmetic -d kosmetic -v umami_password=... -f umami-db-init.sql
--
-- CREATE DATABASE cannot run inside a DO block (and psql variables are not
-- expanded inside one), hence the SELECT … \gexec pattern.
\set ON_ERROR_STOP on

SELECT format('CREATE ROLE umami LOGIN PASSWORD %L', :'umami_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'umami') \gexec

SELECT format('ALTER ROLE umami WITH LOGIN PASSWORD %L', :'umami_password') \gexec

SELECT 'CREATE DATABASE umami OWNER umami'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'umami') \gexec

-- Every role may connect to every database by default (the PUBLIC grant).
-- Take that away so the analytics role can never open the database with
-- the customers' contact and consultation requests. kosmetic keeps access
-- as the owner; umami keeps access to its own database the same way.
REVOKE CONNECT ON DATABASE kosmetic FROM PUBLIC;
REVOKE CONNECT ON DATABASE umami FROM PUBLIC;
