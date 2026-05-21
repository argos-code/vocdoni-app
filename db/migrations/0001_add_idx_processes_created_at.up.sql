-- Must be executed outside a transaction block (cannot run CONCURRENTLY inside BEGIN/COMMIT)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processes_created_at ON processes(created_at DESC);
