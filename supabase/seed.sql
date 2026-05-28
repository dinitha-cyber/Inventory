-- Seed Data for Secure Employee and Asset Inventory System

-- Insert Companies
INSERT INTO companies (name) VALUES 
('Muthukaruppan Chettiar'),
('Madhavi'),
('Sri Madhavi'),
('Sunshine'),
('Peal Isle');

-- Insert Branches for Muthukaruppan Chettiar
WITH mc AS (SELECT id FROM companies WHERE name = 'Muthukaruppan Chettiar')
INSERT INTO branches (company_id, name) VALUES 
((SELECT id FROM mc), 'Headoffice'),
((SELECT id FROM mc), 'Sea street'),
((SELECT id FROM mc), 'Negombo'),
((SELECT id FROM mc), 'Kandy');

-- Insert Branches for Sunshine
WITH sunshine AS (SELECT id FROM companies WHERE name = 'Sunshine')
INSERT INTO branches (company_id, name) VALUES 
((SELECT id FROM sunshine), 'Kirulapona'),
((SELECT id FROM sunshine), 'Kollupitiya'),
((SELECT id FROM sunshine), 'ACBC'),
((SELECT id FROM sunshine), 'Rosmead'),
((SELECT id FROM sunshine), '5th Lane'),
((SELECT id FROM sunshine), 'Dehiwala'),
((SELECT id FROM sunshine), 'Kohuwala'),
((SELECT id FROM sunshine), 'Nawala'),
((SELECT id FROM sunshine), 'Wattala'),
((SELECT id FROM sunshine), 'Malabe'),
((SELECT id FROM sunshine), 'Mattegoda'),
((SELECT id FROM sunshine), 'Thalawathugoda'),
((SELECT id FROM sunshine), 'Rajagiriya'),
((SELECT id FROM sunshine), 'Koswatta'),
((SELECT id FROM sunshine), 'Pelawatta'),
((SELECT id FROM sunshine), 'Saranankara'),
((SELECT id FROM sunshine), 'Dickmans'),
((SELECT id FROM sunshine), 'Dematagoda'),
((SELECT id FROM sunshine), 'On the go');

-- Insert Departments for Muthukaruppan Chettiar -> Headoffice
WITH headoffice AS (
  SELECT b.id FROM branches b 
  JOIN companies c ON b.company_id = c.id 
  WHERE c.name = 'Muthukaruppan Chettiar' AND b.name = 'Headoffice'
)
INSERT INTO departments (branch_id, name) VALUES 
((SELECT id FROM headoffice), 'HR'),
((SELECT id FROM headoffice), 'Directors'),
((SELECT id FROM headoffice), 'IT'),
((SELECT id FROM headoffice), 'Inventory'),
((SELECT id FROM headoffice), 'Gems'),
((SELECT id FROM headoffice), 'Call center'),
((SELECT id FROM headoffice), 'Craftmans'),
((SELECT id FROM headoffice), 'Media'),
((SELECT id FROM headoffice), 'Finance'),
((SELECT id FROM headoffice), 'Others');
