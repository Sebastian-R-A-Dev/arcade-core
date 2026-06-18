-- Normalizar fila placeholder antigua
UPDATE "apps"
SET
  "name" = 'ADMIN_APP',
  "type" = 'administration'::"AppType",
  "is_active" = true
WHERE "name" = '__legacy_users__';

-- Promover ADMIN_APP creada como quiz en migración intermedia
UPDATE "apps"
SET
  "type" = 'administration'::"AppType",
  "is_active" = true
WHERE "name" = 'ADMIN_APP' AND "type" = 'quiz'::"AppType";
