-- Create Policies to allow authenticated users to perform operations
-- This fixes the issue where dropdowns are empty and saving assets throws an RLS error.

-- Companies
CREATE POLICY "Allow authenticated read access" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON companies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON companies FOR DELETE TO authenticated USING (true);

-- Branches
CREATE POLICY "Allow authenticated read access" ON branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON branches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON branches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON branches FOR DELETE TO authenticated USING (true);

-- Departments
CREATE POLICY "Allow authenticated read access" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON departments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON departments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON departments FOR DELETE TO authenticated USING (true);

-- Employees
CREATE POLICY "Allow authenticated read access" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON employees FOR DELETE TO authenticated USING (true);

-- Laptops
CREATE POLICY "Allow authenticated read access" ON laptops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON laptops FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON laptops FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON laptops FOR DELETE TO authenticated USING (true);

-- Mobiles
CREATE POLICY "Allow authenticated read access" ON mobiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON mobiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON mobiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON mobiles FOR DELETE TO authenticated USING (true);

-- Accessories
CREATE POLICY "Allow authenticated read access" ON accessories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON accessories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON accessories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON accessories FOR DELETE TO authenticated USING (true);
