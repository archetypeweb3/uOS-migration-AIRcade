-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum for claim status
CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create enum for network type
CREATE TYPE network_type AS ENUM ('solana', 'base');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Claims table
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(18, 8) NOT NULL,
    status claim_status DEFAULT 'pending',
    network network_type NOT NULL,
    merkle_proof JSONB NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Snapshots table
CREATE TABLE snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network network_type NOT NULL,
    block_height BIGINT NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_claims_user_id ON claims(user_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_network ON claims(network);
CREATE INDEX idx_snapshots_network ON snapshots(network);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Claims policies
CREATE POLICY "Users can view their own claims"
    ON claims FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own claims"
    ON claims FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Snapshots policies (admin only)
CREATE POLICY "Only admins can manage snapshots"
    ON snapshots
    USING (auth.jwt() ->> 'role' = 'admin'); 