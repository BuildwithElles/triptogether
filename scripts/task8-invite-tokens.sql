-- Task 8: Create Invite System Tables (invite_tokens)
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create invite_tokens table with DO block
DO $$
BEGIN
  -- Create the invite_tokens table
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'invite_tokens'
  ) THEN
    CREATE TABLE public.invite_tokens (
      -- Primary key
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      
      -- Token and trip relationship
      token VARCHAR(255) NOT NULL UNIQUE,
      trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
      
      -- Invite metadata
      created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      email VARCHAR(255), -- Optional: specific email for targeted invites
      max_uses INTEGER DEFAULT 1, -- How many times this token can be used
      current_uses INTEGER DEFAULT 0, -- How many times it has been used
      
      -- Expiration and status
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      
      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT invite_tokens_max_uses_positive CHECK (max_uses > 0),
      CONSTRAINT invite_tokens_current_uses_not_negative CHECK (current_uses >= 0),
      CONSTRAINT invite_tokens_current_uses_within_max CHECK (current_uses <= max_uses),
      CONSTRAINT invite_tokens_expires_at_future CHECK (expires_at > created_at),
      CONSTRAINT invite_tokens_token_format CHECK (LENGTH(token) >= 16 AND LENGTH(token) <= 255)
    );
    
    RAISE NOTICE 'Created invite_tokens table successfully';
  ELSE
    RAISE NOTICE 'Table invite_tokens already exists, skipping creation';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating invite_tokens table: %', SQLERRM;
END $$;
