-- Company location (superadmin + company settings)
ALTER TABLE tenants ADD COLUMN city TEXT;
ALTER TABLE tenants ADD COLUMN address TEXT;
