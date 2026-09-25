-- Prototype schema: dropped and recreated on every db:apply run.
DROP TABLE IF EXISTS rsvps, events, budget_transactions, budgets,
  program_history, todos, stars, parents, families CASCADE;

CREATE TABLE families (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL
);

CREATE TABLE parents (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE stars (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  school_name TEXT,
  school_district TEXT
);

CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  due_date DATE,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

CREATE TABLE program_history (
  id SERIAL PRIMARY KEY,
  star_id INTEGER NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('course', 'competition', 'camp')),
  title TEXT NOT NULL,
  provider TEXT,
  start_date DATE,
  end_date DATE,
  result TEXT,
  notes TEXT
);

CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  allocated_cents INTEGER NOT NULL,
  UNIQUE (family_id, fiscal_year)
);

CREATE TABLE budget_transactions (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  occurred_on DATE NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT,
  amount_cents INTEGER NOT NULL,
  description TEXT
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('virtual', 'in_person')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  rsvp_deadline TIMESTAMPTZ
);

CREATE TABLE rsvps (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, family_id)
);
