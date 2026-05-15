-- Enrollment branch copied from customer; kept in sync when customer location_id changes.
ALTER TABLE financing_requests ADD COLUMN location_id INTEGER REFERENCES tenant_locations(id);

CREATE INDEX IF NOT EXISTS idx_financing_requests_location_id ON financing_requests (location_id);

UPDATE financing_requests
SET location_id = (
  SELECT c.location_id FROM customers c WHERE c.id = financing_requests.customer_id
)
WHERE location_id IS NULL;
