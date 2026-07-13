import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { BadRequest, NotFound } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { getStockMap } from "../services/stock";
import { TipoMovimiento } from "@prisma/client";

export const movimientosRouter = Router();

movimientosRouter.use(requireAuth);

const incluir = {
  centro: { select: { id: true, nombre: true } },
  usuario: { select: { id: true, nombre: true } },
  items: { include: { insumo: { select: { id: true, nombre: true, unidadMedida: true } } } },
};

// GET /api/movimientos  (filtros: tipo, centroId, insumoId, desde, hasta)
movimientosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { tipo, centroId, insumoId, desde, hasta } = req.query;

    const where: Record<string, unknown> = {};
    if (tipo === "ENTRADA" || tipo === "SALIDA") where.tipo = tipo;
    if (typeof centroId === "string") where.centroId = centroId;
    if (typeof insumoId === "string") where.items = { some: { insumoId } };
    if (typeof desde === "string" || typeof hasta === "string") {
      where.fecha = {};
      if (typeof desde === "string") (where.fecha as Record<string, Date>).gte = new Date(desde);
      if (typeof hasta === "string") (where.fecha as Record<string, Date>).lte = new Date(hasta);
    }

    const movimientos = await prisma.movimiento.findMany({
      where,
      include: incluir,
      orderBy: { fecha: "desc" },
      take: 200,
    });
    res.json(movimientos);
  })
);

// GET /api/movimientos/:id
movimientosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const mov = await prisma.movimiento.findUnique({
      where: { id: req.params.id },
      include: incluir,
    });
    if (!mov) throw NotFound("Movimiento no encontrado");
    res.json(mov);
  })
);

const itemSchema = z.object({
  insumoId: z.string().min(1, "insumoId requerido"),
  porCaja: z.boolean().optional(),
  // Modo individual: se envia "cantidad" (unidades).
  cantidad: z.number().positive().optional(),
  // Modo caja: se envian "cajas" y "unidadesPorCaja".
  cajas: z.number().positive().optional(),
  unidadesPorCaja: z.number().int().positive().optional(),
});

const crearSchema = z.object({
  tipo: z.nativeEnum(TipoMovimiento),
  centroId: z.string().optional().nullable(),
  fecha: z.string().optional(),
  origen: z.string().optional(),
  nota: z.string().optional(),
  items: z.array(itemSchema).min(1, "Debe incluir al menos un insumo"),
});

// POST /api/movimientos  (ADMIN u OPERADOR: ambos pueden registrar)
movimientosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = crearSchema.safeParse(req.body);
    if (!parsed.success) throw BadRequest(parsed.error.issues[0].message);
    const { tipo, items, fecha, origen, nota } = parsed.data;
    let { centroId } = parsed.data;

    // Regla: ENTRADA va al almacen (sin centro). SALIDA requiere centro destino.
    if (tipo === TipoMovimiento.ENTRADA) {
      centroId = null;
    } else {
      if (!centroId) throw BadRequest("Una SALIDA debe indicar el centro de acopio destino");
      const centro = await prisma.centroAcopio.findUnique({ where: { id: centroId } });
      if (!centro) throw NotFound("Centro de acopio no encontrado");
      if (!centro.activo) throw BadRequest("El centro de acopio esta inactivo");
    }

    // Validar que todos los insumos existan.
    const insumoIds = [...new Set(items.map((i) => i.insumoId))];
    const insumos = await prisma.insumo.findMany({ where: { id: { in: insumoIds } } });
    if (insumos.length !== insumoIds.length) {
      throw BadRequest("Uno o mas insumos no existen");
    }
    const nombres = new Map(insumos.map((i) => [i.id, i.nombre]));

    // Resolver cada linea a su cantidad en UNIDADES BASE, guardando la presentacion.
    const itemsData = items.map((it) => {
      if (it.porCaja) {
        if (!it.cajas || !it.unidadesPorCaja) {
          throw BadRequest(
            `Para "${nombres.get(it.insumoId)}" por caja indica numero de cajas y unidades por caja`
          );
        }
        return {
          insumoId: it.insumoId,
          cantidad: it.cajas * it.unidadesPorCaja, // total en unidades base
          porCaja: true,
          cajas: it.cajas,
          unidadesPorCaja: it.unidadesPorCaja,
        };
      }
      if (!it.cantidad || it.cantidad <= 0) {
        throw BadRequest(`Indica una cantidad valida para "${nombres.get(it.insumoId)}"`);
      }
      return {
        insumoId: it.insumoId,
        cantidad: it.cantidad,
        porCaja: false,
        cajas: null,
        unidadesPorCaja: null,
      };
    });

    // En SALIDA: no permitir distribuir mas de lo disponible (en unidades base).
    if (tipo === TipoMovimiento.SALIDA) {
      const stock = await getStockMap();
      const solicitado = new Map<string, number>();
      for (const it of itemsData) {
        solicitado.set(it.insumoId, (solicitado.get(it.insumoId) ?? 0) + it.cantidad);
      }
      for (const [insumoId, cantidad] of solicitado) {
        const disponible = stock.get(insumoId) ?? 0;
        if (cantidad > disponible) {
          throw BadRequest(
            `Stock insuficiente de "${nombres.get(insumoId)}": disponible ${disponible}, solicitado ${cantidad}`
          );
        }
      }
    }

    const movimiento = await prisma.movimiento.create({
      data: {
        tipo,
        centroId,
        usuarioId: req.usuario!.id,
        origen,
        nota,
        ...(fecha ? { fecha: new Date(fecha) } : {}),
        items: { create: itemsData },
      },
      include: incluir,
    });

    res.status(201).json(movimiento);
  })
);
