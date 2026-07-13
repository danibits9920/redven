import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { BadRequest, NotFound } from "../lib/errors";
import { requireAuth } from "../middleware/auth";

export const insumosRouter = Router();

// Cualquier usuario autenticado puede ver y gestionar insumos.
insumosRouter.use(requireAuth);

// GET /api/insumos
insumosRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const insumos = await prisma.insumo.findMany({ orderBy: { nombre: "asc" } });
    res.json(insumos);
  })
);

// GET /api/insumos/:id
insumosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const insumo = await prisma.insumo.findUnique({ where: { id: req.params.id } });
    if (!insumo) throw NotFound("Insumo no encontrado");
    res.json(insumo);
  })
);

const insumoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria: z.string().optional(),
  unidadMedida: z.string().min(1).default("unidad"),
  // Unidades por caja: entero > 0, o null si no se maneja por cajas.
  unidadesPorCaja: z.number().int().positive().nullable().optional(),
  activo: z.boolean().optional(),
});

// POST /api/insumos
insumosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = insumoSchema.safeParse(req.body);
    if (!parsed.success) throw BadRequest(parsed.error.issues[0].message);
    const insumo = await prisma.insumo.create({ data: parsed.data });
    res.status(201).json(insumo);
  })
);

// PUT /api/insumos/:id
insumosRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = insumoSchema.partial().safeParse(req.body);
    if (!parsed.success) throw BadRequest(parsed.error.issues[0].message);
    const existe = await prisma.insumo.findUnique({ where: { id: req.params.id } });
    if (!existe) throw NotFound("Insumo no encontrado");
    const insumo = await prisma.insumo.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(insumo);
  })
);
