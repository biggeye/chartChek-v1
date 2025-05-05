-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create chat_sessions table to track chat conversations
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (account_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create chat_messages table to store message history
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    account_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create context_items table to store structured context
CREATE TABLE IF NOT EXISTS context_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('document', 'evaluation', 'upload')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create session_context table to link context items to chat sessions
CREATE TABLE IF NOT EXISTS session_context (
    session_id UUID NOT NULL,
    context_item_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, context_item_id),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (context_item_id) REFERENCES context_items(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_account_id ON chat_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_context_items_account_id ON context_items(account_id);
CREATE INDEX IF NOT EXISTS idx_context_items_type ON context_items(type);
CREATE INDEX IF NOT EXISTS idx_session_context_session_id ON session_context(session_id);
CREATE INDEX IF NOT EXISTS idx_session_context_context_item_id ON session_context(context_item_id);

-- Add RLS policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_context ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions"
    ON chat_sessions FOR SELECT
    USING (account_id = auth.uid());

CREATE POLICY "Users can create their own chat sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (account_id = auth.uid());

-- RLS policies for chat_messages
CREATE POLICY "Users can view messages in their sessions"
    ON chat_messages FOR SELECT
    USING (account_id = auth.uid());

CREATE POLICY "Users can create messages in their sessions"
    ON chat_messages FOR INSERT
    WITH CHECK (account_id = auth.uid());

-- RLS policies for context_items
CREATE POLICY "Users can view their own context items"
    ON context_items FOR SELECT
    USING (account_id = auth.uid());

CREATE POLICY "Users can create their own context items"
    ON context_items FOR INSERT
    WITH CHECK (account_id = auth.uid());

-- RLS policies for session_context
CREATE POLICY "Users can view context for their sessions"
    ON session_context FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM chat_sessions
        WHERE chat_sessions.id = session_context.session_id
        AND chat_sessions.account_id = auth.uid()
    ));

CREATE POLICY "Users can link context to their sessions"
    ON session_context FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM chat_sessions
        WHERE chat_sessions.id = session_context.session_id
        AND chat_sessions.account_id = auth.uid()
    ));

-- Functions for managing timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_context_items_updated_at
    BEFORE UPDATE ON context_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 