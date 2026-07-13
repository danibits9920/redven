import { prisma } from "../lib/prisma";
import { TipoMovimiento } from "@prisma/client";

// Stock del almacen por insumo = suma de ENTRADAS - suma de SALIDAS.
// Nunca se guarda: siempre se calcula desde los movimientos (auditable).
export async function getStockMap(): Promise<Map<string, number>> {
  const [entradas, salidas] = await Promise.all([
    prisma.movimientoItem.groupBy({
      by: ["insumoId"],
      where: { movimiento: { tipo: TipoMovimiento.ENTRADA } },
      _sum: { cantidad: true },
    }),
    prisma.movimientoItem.groupBy({
      by: ["insumoId"],
      where: { movimiento: { tipo: TipoMovimiento.SALIDA } },
      _sum: { cantidad: true },
    }),
  ]);

  const map = new Map<string, number>();
  for (const e of entradas) {
    map.set(e.insumoId, Number(e._sum.cantidad ?? 0));
  }
  for (const s of salidas) {
    map.set(s.insumoId, (map.get(s.insumoId) ?? 0) - Number(s._sum.cantidad ?? 0));
  }
  return map;
}

// Stock del almacen con los datos de cada insumo, listo para mostrar.
export async function getStockAlmacen() {
  const map = await getStockMap();
  const insumos = await prisma.insumo.findMany({ orderBy: { nombre: "asc" } });
  return insumos.map((i) => ({
    insumoId: i.id,
    nombre: i.nombre,
    categoria: i.categoria,
    unidadMedida: i.unidadMedida,
    stock: map.get(i.id) ?? 0,
  }));
}

// Total recibido por un centro de acopio (suma de todas las SALIDAS hacia el).
export async function getRecibidoPorCentro(centroId: string) {
  const items = await prisma.movimientoItem.groupBy({
    by: ["insumoId"],
    where: { movimiento: { tipo: TipoMovimiento.SALIDA, centroId } },
    _sum: { cantidad: true },
  });
  const insumoIds = items.map((i) => i.insumoId);
  const insumos = await prisma.insumo.findMany({ where: { id: { in: insumoIds } } });
  const byId = new Map(insumos.map((i) => [i.id, i]));
  return items.map((i) => ({
    insumoId: i.insumoId,
    nombre: byId.get(i.insumoId)?.nombre ?? "",
    unidadMedida: byId.get(i.insumoId)?.unidadMedida ?? "",
    total: Number(i._sum.cantidad ?? 0),
  }));
}
