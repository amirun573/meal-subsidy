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
  feature_link,
) VALUES (
  'report',                  -- feature_code
  'Report',           -- feature_name
  'Report will show the usage for credit.',   -- description
  '/report',      -- feature_link
);

INSERT INTO Feature (
  feature_code,
  feature_name,
  description,
  feature_link,
) VALUES (
  'employee_details',                  -- feature_code
  'Employee Details',           -- feature_name
  'Show Details of Employee.',   -- description
  '/employee-details',      -- feature_link
);

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



