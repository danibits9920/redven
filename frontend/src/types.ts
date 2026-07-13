export type Rol = "ADMIN" | "OPERADOR";
export type TipoMovimiento = "ENTRADA" | "SALIDA";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo?: boolean;
}

export interface CentroAcopio {
  id: string;
  nombre: string;
  direccion?: string | null;
  responsable?: string | null;
  contacto?: string | null;
  activo: boolean;
}

export interface Insumo {
  id: string;
  nombre: string;
  categoria?: string | null;
  unidadMedida: string;
  unidadesPorCaja?: number | null;
  activo: boolean;
}

export interface MovimientoItem {
  id: string;
  insumoId: string;
  cantidad: string | number;
  porCaja?: boolean;
  cajas?: string | number | null;
  unidadesPorCaja?: number | null;
  insumo?: { id: string; nombre: string; unidadMedida: string };
}

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  centroId?: string | null;
  fecha: string;
  origen?: string | null;
  nota?: string | null;
  centro?: { id: string; nombre: string } | null;
  usuario?: { id: string; nombre: string };
  items: MovimientoItem[];
}

export interface StockItem {
  insumoId: string;
  nombre: string;
  categoria?: string | null;
  unidadMedida: string;
  stock: number;
}

export interface Resumen {
  totalCentros: number;
  totalInsumos: number;
  totalMovimientos: number;
  stock: StockItem[];
}
