-- Schema for Secure Employee and Asset Inventory System

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: companies
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: branches
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: employees
CREATE TABLE employees (
    employee_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_no VARCHAR(50),
    company_id INTEGER REFERENCES companies(id),
    branch_id INTEGER REFERENCES branches(id),
    department_id INTEGER REFERENCES departments(id) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: laptops
CREATE TABLE laptops (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_no VARCHAR(100) UNIQUE NOT NULL,
    ram VARCHAR(50),
    ssd VARCHAR(50),
    has_warranty BOOLEAN DEFAULT false,
    warranty_period VARCHAR(100),
    remarks TEXT,
    past_user TEXT,
    assigned_to VARCHAR(50) REFERENCES employees(employee_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: mobiles
CREATE TABLE mobiles (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_no VARCHAR(100) UNIQUE NOT NULL,
    imei_no VARCHAR(100) UNIQUE NOT NULL,
    has_warranty BOOLEAN DEFAULT false,
    warranty_period VARCHAR(100),
    remarks TEXT,
    past_user TEXT,
    assigned_to VARCHAR(50) REFERENCES employees(employee_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: accessories
CREATE TABLE accessories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    serial_no VARCHAR(100) UNIQUE,
    has_warranty BOOLEAN DEFAULT false,
    warranty_period VARCHAR(100),
    remarks TEXT,
    assigned_to VARCHAR(50) REFERENCES employees(employee_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Security: Enable Row Level Security (RLS)
-- We will secure this via Supabase Auth. Only authenticated users can view, only admins can edit.
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE laptops ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;

-- Creating basic RLS policies (Read for all authenticated, Write for admin only)
-- Policy definition omitted for brevity; this should be implemented based on exact jwt custom claims setup or role table.
