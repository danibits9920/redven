import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { NotFound } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { getStockAlmacen, getRecibidoPorCentro } from "../services/stock";

export const reportesRouter = Router();

reportesRouter.use(requireAuth);

// GET /api/reportes/stock  -> stock actual del almacen por insumo
reportesRouter.get(
  "/stock",
  asyncHandler(async (_req, res) => {
    res.json(await getStockAlmacen());
  })
);

// GET /api/reportes/centros/:id  -> que ha recibido un centro (historial agregado)
reportesRouter.get(
  "/centros/:id",
  asyncHandler(async (req, res) => {
    const centro = await prisma.centroAcopio.findUnique({ where: { id: req.params.id } });
    if (!centro) throw NotFound("Centro no encontrado");
    const recibido = await getRecibidoPorCentro(centro.id);
    res.json({ centro, recibido });
  })
);

// GET /api/reportes/resumen  -> numeros para el dashboard
reportesRouter.get(
  "/resumen",
  asyncHandler(async (_req, res) => {
    const [totalCentros, totalInsumos, totalMovimientos, stock] = await Promise.all([
      prisma.centroAcopio.count({ where: { activo: true } }),
      prisma.insumo.count({ where: { activo: true } }),
      prisma.movimiento.count(),
      getStockAlmacen(),
    ]);
    res.json({
      totalCentros,
      totalInsumos,
      totalMovimientos,
      stock,
    });
  })
);
