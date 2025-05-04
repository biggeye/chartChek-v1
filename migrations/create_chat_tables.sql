-- Drop tables in correct order (messages first due to foreign key constraints)
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.chat_sessions;

-- Create the chat_sessions table first since it will be referenced by chat_messages
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Adding an index on account_id for faster lookups of user's sessions
    CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create an index on account_id for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_account_id ON public.chat_sessions(account_id);

-- Create the chat_messages table with appropriate foreign key constraints
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    account_id UUID NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Adding foreign key constraints
    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_account FOREIGN KEY (account_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Adding a check constraint for role
    CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system', 'function', 'tool', 'data'))
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_account_id ON public.chat_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions"
    ON public.chat_sessions
    FOR SELECT
    TO authenticated
    USING (account_id = auth.uid());

CREATE POLICY "Users can create their own chat sessions"
    ON public.chat_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions"
    ON public.chat_sessions
    FOR UPDATE
    TO authenticated
    USING (account_id = auth.uid())
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can delete their own chat sessions"
    ON public.chat_sessions
    FOR DELETE
    TO authenticated
    USING (account_id = auth.uid());

-- Create policies for chat_messages
CREATE POLICY "Users can view messages in their sessions"
    ON public.chat_messages
    FOR SELECT
    TO authenticated
    USING (account_id = auth.uid());

CREATE POLICY "Users can create messages in their sessions"
    ON public.chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can update their own messages"
    ON public.chat_messages
    FOR UPDATE
    TO authenticated
    USING (account_id = auth.uid())
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
    ON public.chat_messages
    FOR DELETE
    TO authenticated
    USING (account_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated; 