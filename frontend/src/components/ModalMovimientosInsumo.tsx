import { useQuery } from "@tanstack/react-query";
import { Modal, Spinner } from "react-bootstrap";
import { api } from "../api/client";
import type { StockItem, Movimiento } from "../types";
import { MovBadge, textoCantidad } from "./ui";

async function fetchMovimientosDeInsumo(insumoId: string): Promise<Movimiento[]> {
  const { data } = await api.get("/movimientos", { params: { insumoId } });
  return data;
}

// Modal con todos los movimientos (entradas/salidas) que incluyen un insumo.
export default function ModalMovimientosInsumo({
  insumo,
  onClose,
}: {
  insumo: StockItem | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["movimientos-insumo", insumo?.insumoId],
    queryFn: () => fetchMovimientosDeInsumo(insumo!.insumoId),
    enabled: !!insumo,
  });

  return (
    <Modal show={!!insumo} onHide={onClose} scrollable centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          {insumo?.nombre}
          {insumo && (
            <div className="small text-secondary fw-normal">
              Stock disponible: {insumo.stock} {insumo.unidadMedida}
            </div>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="success" size="sm" />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-secondary mb-0">Este insumo no aparece en ningun movimiento aun.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {data.map((m) => {
              const item = m.items.find((it) => it.insumoId === insumo?.insumoId);
              return (
                <div key={m.id} className="border rounded p-2">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
                    <div className="d-flex align-items-center gap-2">
                      <MovBadge tipo={m.tipo} />
                      <span className="fw-semibold">
                        {item ? textoCantidad(item, insumo?.unidadMedida) : ""}
                      </span>
                    </div>
                    <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                      {new Date(m.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="small text-secondary mt-1">
                    {m.tipo === "ENTRADA"
                      ? `Entrada al almacen${m.origen ? ` · ${m.origen}` : ""}`
                      : `Enviado a: ${m.centro?.nombre ?? "-"}`}
                    {m.usuario ? ` · ${m.usuario.nombre}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
