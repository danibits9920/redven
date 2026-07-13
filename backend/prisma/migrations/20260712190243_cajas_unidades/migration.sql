-- AlterTable
ALTER TABLE "insumos" ADD COLUMN     "unidadesPorCaja" INTEGER;

-- AlterTable
ALTER TABLE "movimiento_items" ADD COLUMN     "cajas" DECIMAL(14,3),
ADD COLUMN     "porCaja" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unidadesPorCaja" INTEGER;
