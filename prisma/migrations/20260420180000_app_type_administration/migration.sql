-- AlterEnum (solo este paso: el valor debe existir en una transacción confirmada antes de usarlo en otra migración)
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AppType'
      AND e.enumlabel = 'administration'
  ) THEN
    ALTER TYPE "AppType" ADD VALUE 'administration';
  END IF;
END$migration$;
