ALTER TABLE contracts ADD COLUMN location_id INTEGER REFERENCES tenant_locations(id);
