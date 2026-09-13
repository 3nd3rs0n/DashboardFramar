-- Keep finding identifiers sequential without reusing numbers after deletions.
CREATE SEQUENCE "finding_code_seq";

WITH current_max AS (
  SELECT COALESCE(MAX((substring("code" FROM '^H-([0-9]+)$'))::bigint), 0) AS max_number
  FROM "Finding"
), missing_codes AS (
  SELECT finding."id", current_max.max_number + ROW_NUMBER() OVER (ORDER BY finding."createdAt", finding."id") AS next_number
  FROM "Finding" AS finding
  CROSS JOIN current_max
  WHERE finding."code" IS NULL
)
UPDATE "Finding" AS finding
SET "code" = 'H-' || LPAD(missing_codes.next_number::text, 3, '0')
FROM missing_codes
WHERE finding."id" = missing_codes."id";

SELECT setval(
  '"finding_code_seq"',
  GREATEST(COALESCE(current_max.max_number, 1), 1),
  current_max.max_number IS NOT NULL
)
FROM (
  SELECT MAX((substring("code" FROM '^H-([0-9]+)$'))::bigint) AS max_number
  FROM "Finding"
) AS current_max;
