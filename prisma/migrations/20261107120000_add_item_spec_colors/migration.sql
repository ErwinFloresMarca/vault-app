-- Colores disponibles de un item (ficha técnica): [{ "name", "hex" }]
ALTER TABLE "ItemSpec" ADD COLUMN "colors" JSONB NOT NULL DEFAULT '[]';
