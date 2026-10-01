-- Seed idempotente de insignias (datos de referencia de gamificación).
INSERT INTO "Achievement" ("id", "key", "name", "description", "icon", "xpReward", "sortOrder") VALUES
  ('ach_first_item', 'first-item', 'Primera pieza', 'Consigue tu primera pieza.', 'i-lucide-package', 100, 1),
  ('ach_collector_10', 'collector-10', 'Coleccionista', 'Consigue 10 piezas.', 'i-lucide-trophy', 250, 2),
  ('ach_collection_complete', 'collection-complete', 'Maestro de serie', 'Completa una colección al 100%.', 'i-lucide-award', 500, 3),
  ('ach_legendary_owner', 'legendary-owner', 'Cazador de legendarias', 'Consigue una pieza legendaria.', 'i-lucide-gem', 400, 4)
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "xpReward" = EXCLUDED."xpReward",
  "sortOrder" = EXCLUDED."sortOrder";
