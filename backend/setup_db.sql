-- Run this in pgAdmin Query Tool (connected as postgres superuser)
-- or: psql -U postgres -f setup_db.sql

CREATE USER cosmoplexx WITH PASSWORD 'password';
CREATE DATABASE cosmoplexx OWNER cosmoplexx;
GRANT ALL PRIVILEGES ON DATABASE cosmoplexx TO cosmoplexx;
