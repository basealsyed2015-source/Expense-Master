-- Dynamic customer attachments: user-defined labels, up to 15 per customer (enforced in app).
ALTER TABLE customers ADD COLUMN attachments_json TEXT;
