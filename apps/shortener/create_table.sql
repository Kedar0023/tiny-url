CREATE TABLE urls (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  short_url  VARCHAR(8) NOT NULL,
  long_url   TEXT NOT NULL CHECK (length(long_url) <= 2048),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_count BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX urls_short_url_key ON urls (short_url);