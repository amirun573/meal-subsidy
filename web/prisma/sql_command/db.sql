INSERT INTO "Region" (region_code, region_name, active, uuid, created_at, updated_at)
VALUES ('asia', 'ASIA', true, uuid_generate_v4(), now(), now());

INSERT INTO "Country" (
    country_code, 
    country_name, 
    region_id, 
    currency, 
    currency_code, 
    active, 
    uuid, 
    created_at, 
    updated_at, 
    country_phone_code
)
VALUES (
    'my', 
    'MALAYSIA', 
    (SELECT region_id FROM "Region" WHERE region_code = 'asia'), 
    'Ringgit', 
    'MYR', 
    true, 
    uuid_generate_v4(), 
    now(), 
    now(), 
    '+60'
);

INSERT INTO Feature (
  feature_code,
  feature_name,
  description,
  feature_link
) VALUES
  ('report',                 
   'Report',           
   'Report will show the usage for credit.',   
   '/report'),
   
  ('employee_details',            
   'Employee Details',          
   'Show Details of Employee.', 
   '/employee-details'),
   
    ('subsidy',                 
   'Subsidy',           
   'Setup Subsidy.',   
   '/subsidy');
   
   ;


INSERT INTO SubsidyType(
  subsidy_type_code,
  subsidy_type_name,
  price,
) VALUES (
  'meal',
  'Meal Subsidy',
  5,
);

INSERT INTO ROLE(
  role_code,
  role_name
) VALUES (
  'super_admin',
  'Super Admin'
);

INSERT INTO ROLE(
  role_code,
  role_name
) VALUES (
  'employee',
  'Employee'
);

INSERT INTO EmployeeCategory (employee_category_code, employee_category_name)
VALUES ('dl', 'DIRECT LABOUR');

INSERT INTO EmployeeCategory (employee_category_code, employee_category_name)
VALUES ('idl', 'INDIRECT LABOUR');

INSERT INTO EmployeeCategory (employee_category_code, employee_category_name)
VALUES ('ndl', 'Non Eligible DIRECT LABOUR');

INSERT INTO DEPARTMENT (department_code, department_name)
VALUES 
  ('hr', 'HUMAN RESOURCE'),
  ('finance', 'FINANCE'),
  ('op', 'OPERATIONS'),
  ('cs', 'CUSTOMER SERVICE'),
  ('en', 'ENGINEERING'),
  ('fc', 'FACILITIES'),
  ('hs&e', 'HS&E'),
  ('it', 'INFORMATION TECHNOLOGY'),
  ('pm', 'PRODUCT MANAGEMENT'),
  ('pr', 'PRODUCTION'),
  ('qa', 'QUALITY ASSURANCE'),
  ('rc', 'REGIONAL COMMUNICATION'),
  ('sa', 'SALES'),
  ('sc', 'SUPPLY CHAIN'),
  ('qc', 'QUALITY CONTROL');

  INSERT INTO COSTCENTER (cost_center_code)
VALUES
  ('037-31'),
  ('037-3001'),
  ('037-60'),
  ('037-6962'),
  ('037-6077'),
  ('037-30'),
  ('037-3101'),
  ('037-34'),
  ('037-3401'),
  ('037-38'),
  ('037-6071'),
  ('037-33'),
  ('037-32')
;




