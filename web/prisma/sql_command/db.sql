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


