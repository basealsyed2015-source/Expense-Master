-- Optional contact-only email. It is not used for login or password resets.
ALTER TABLE users ADD COLUMN secondary_email TEXT;
