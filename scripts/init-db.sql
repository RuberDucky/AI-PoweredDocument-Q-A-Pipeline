-- Create database if it doesn't exist
SELECT 'CREATE DATABASE "ragPipeline"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ragPipeline')\gexec

-- Connect to the database
\c ragPipeline;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created automatically by Sequelize, but can be added here for explicit control

-- Users table indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON "Users" (email);
-- CREATE INDEX IF NOT EXISTS idx_users_active ON "Users" (is_active);

-- Documents table indexes  
-- CREATE INDEX IF NOT EXISTS idx_documents_user ON "Documents" (uploaded_by);
-- CREATE INDEX IF NOT EXISTS idx_documents_processed ON "Documents" (is_processed);
-- CREATE INDEX IF NOT EXISTS idx_documents_created ON "Documents" (created_at);

-- QA Sessions table indexes
-- CREATE INDEX IF NOT EXISTS idx_qa_sessions_user ON "QASessions" (user_id);
-- CREATE INDEX IF NOT EXISTS idx_qa_sessions_created ON "QASessions" (created_at);
-- CREATE INDEX IF NOT EXISTS idx_qa_sessions_rating ON "QASessions" (rating);
