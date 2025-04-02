-- Script to check the enum values for location_type
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
WHERE
    t.typname = 'location_type'
ORDER BY
    e.enumsortorder;
