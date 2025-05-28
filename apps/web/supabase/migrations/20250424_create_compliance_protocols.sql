-- Create compliance_protocols table
CREATE TABLE IF NOT EXISTS compliance_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cycle_length INTEGER NOT NULL DEFAULT 7,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create compliance_protocol_requirements table
CREATE TABLE IF NOT EXISTS compliance_protocol_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID NOT NULL REFERENCES compliance_protocols(id) ON DELETE CASCADE,
    evaluation_id INTEGER NOT NULL,
    requirement TEXT NOT NULL CHECK (requirement IN ('admission', 'daily', 'cyclic')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(protocol_id, evaluation_id, requirement)
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_compliance_protocols_updated_at
    BEFORE UPDATE ON compliance_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_protocol_requirements_updated_at
    BEFORE UPDATE ON compliance_protocol_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 