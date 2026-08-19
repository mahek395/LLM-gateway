CREATE EXTENSION IF NOT EXISTS vector;

-- Semantic cache: stores prompt embeddings + the response that was generated for them
CREATE TABLE IF NOT EXISTS cached_prompts (
    id SERIAL PRIMARY KEY,
    prompt_text TEXT NOT NULL,
    embedding vector(1024) NOT NULL,     -- Cohere embed-english-v3.0 is 1024-dim
    response_text TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_hit_at TIMESTAMPTZ
);

-- IVFFlat index for approximate cosine similarity search.
CREATE INDEX IF NOT EXISTS cached_prompts_embedding_idx
    ON cached_prompts USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Request log: every request that hits the gateway, cached or not.
CREATE TABLE IF NOT EXISTS request_log (
    id SERIAL PRIMARY KEY,
    request_id UUID NOT NULL,
    prompt_text TEXT NOT NULL,
    cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
    provider VARCHAR(50),
    model VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    estimated_cost_usd NUMERIC(10, 6),
    latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS request_log_created_at_idx ON request_log (created_at);

-- Admin users for the panel
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API keys issued to consumer apps. Raw key is shown once at creation, never stored.
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    rate_limit_capacity NUMERIC NOT NULL DEFAULT 20,
    refill_per_sec NUMERIC NOT NULL DEFAULT 0.5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

-- Live routing configuration. Single active row (id=1), read on every request
-- via a short-TTL Redis cache. Editing this from the admin panel changes
-- gateway behavior with no redeploy.
CREATE TABLE routing_rules (
    id INTEGER PRIMARY KEY DEFAULT 1,

    routing_policy VARCHAR(50) NOT NULL DEFAULT 'balanced',

    lambda_cost DOUBLE PRECISION NOT NULL DEFAULT 100.0,

    cascade_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.60,

    capability_margin DOUBLE PRECISION NOT NULL DEFAULT 0.08,

    min_capability_floor DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    enable_cascade_fallback BOOLEAN NOT NULL DEFAULT TRUE,

    cache_similarity_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.95,

    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO routing_rules (id) VALUES (1) ON CONFLICT (id) DO NOTHING;