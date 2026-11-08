-- Color elegido por el cliente en cada línea del pedido
ALTER TABLE "OrderItem" ADD COLUMN "colorName" TEXT,
ADD COLUMN "colorHex" TEXT;
