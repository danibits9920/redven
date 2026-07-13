import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { BadRequest, NotFound } from "../lib/errors";
import { requireAuth, requireRole } from "../middleware/auth";
import { Rol } from "@prisma/client";

export const centrosRouter = Router();

// Ver requiere estar autenticado; crear/editar requiere ADMIN.
centrosRouter.use(requireAuth);

// GET /api/centros
centrosRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const centros = await prisma.centroAcopio.findMany({
      orderBy: { nombre: "asc" },
    });
    res.json(centros);
  })
);

// GET /api/centros/:id
centrosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const centro = await prisma.centroAcopio.findUnique({ where: { id: req.params.id } });
    if (!centro) throw NotFound("Centro no encontrado");
    res.json(centro);
  })
);

const centroSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  direccion: z.string().optional(),
  responsable: z.string().optional(),
  contacto: z.string().optional(),
  activo: z.boolean().optional(),
});

// POST /api/centros (ADMIN)
centrosRouter.post(
  "/",
  requireRole(Rol.ADMIN),
  asyncHandler(async (req, res) => {
    const parsed = centroSchema.safeParse(req.body);
    if (!parsed.success) throw BadRequest(parsed.error.issues[0].message);
    const centro = await prisma.centroAcopio.create({ data: parsed.data });
    res.status(201).json(centro);
  })
);

// PUT /api/centros/:id (ADMIN)
centrosRouter.put(
  "/:id",
  requireRole(Rol.ADMIN),
  asyncHandler(async (req, res) => {
    const parsed = centroSchema.partial().safeParse(req.body);
    if (!parsed.success) throw BadRequest(parsed.error.issues[0].message);
    const existe = await prisma.centroAcopio.findUnique({ where: { id: req.params.id } });
    if (!existe) throw NotFound("Centro no encontrado");
    const centro = await prisma.centroAcopio.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(centro);
  })
);
