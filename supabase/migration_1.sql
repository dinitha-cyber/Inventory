-- Add warranty and remarks fields to laptops
ALTER TABLE laptops ADD COLUMN has_warranty BOOLEAN DEFAULT false;
ALTER TABLE laptops ADD COLUMN warranty_period VARCHAR(100);
ALTER TABLE laptops ADD COLUMN remarks TEXT;

-- Add warranty and remarks fields to mobiles
ALTER TABLE mobiles ADD COLUMN has_warranty BOOLEAN DEFAULT false;
ALTER TABLE mobiles ADD COLUMN warranty_period VARCHAR(100);
ALTER TABLE mobiles ADD COLUMN remarks TEXT;

-- Add warranty and remarks fields to accessories
ALTER TABLE accessories ADD COLUMN has_warranty BOOLEAN DEFAULT false;
ALTER TABLE accessories ADD COLUMN warranty_period VARCHAR(100);
ALTER TABLE accessories ADD COLUMN remarks TEXT;
