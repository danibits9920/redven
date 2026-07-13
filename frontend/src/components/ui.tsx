import { type ReactNode } from "react";
import { Badge } from "react-bootstrap";
import type { MovimientoItem } from "../types";

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <h1 className="h4 fw-bold mb-0">{children}</h1>
      {action}
    </div>
  );
}

export function MovBadge({ tipo }: { tipo: "ENTRADA" | "SALIDA" }) {
  return <Badge bg={tipo === "ENTRADA" ? "success" : "warning"}>{tipo}</Badge>;
}

// Muestra la cantidad en unidades base y, si aplica, el detalle en cajas.
// Ej: "240 unidad (10 cajas × 24)"
export function textoCantidad(it: MovimientoItem, unidadFallback?: string): string {
  const unidad = it.insumo?.unidadMedida ?? unidadFallback ?? "";
  const base = `${Number(it.cantidad)} ${unidad}`.trim();
  if (it.porCaja && it.cajas) {
    return `${base} (${Number(it.cajas)} cajas × ${it.unidadesPorCaja})`;
  }
  return base;
}
