import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Form, Card, Table, Spinner, Modal, Badge, InputGroup } from "react-bootstrap";
import { api } from "../api/client";
import type { StockItem, Movimiento } from "../types";
import { PageTitle, MovBadge, textoCantidad } from "../components/ui";

// Normaliza para buscar sin importar mayusculas ni acentos.
function normalizar(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

async function fetchStock(): Promise<StockItem[]> {
  const { data } = await api.get("/reportes/stock");
  return data;
}

async function fetchMovimientosDeInsumo(insumoId: string): Promise<Movimiento[]> {
  const { data } = await api.get("/movimientos", { params: { insumoId } });
  return data;
}

export default function Buscar() {
  const [q, setQ] = useState("");
  const [seleccion, setSeleccion] = useState<StockItem | null>(null);

  const { data: stock, isLoading } = useQuery({ queryKey: ["stock-buscar"], queryFn: fetchStock });

  const filtrados = useMemo(() => {
    if (!stock) return [];
    const term = normalizar(q.trim());
    if (!term) return stock;
    return stock.filter(
      (s) =>
        normalizar(s.nombre).includes(term) ||
        (s.categoria ? normalizar(s.categoria).includes(term) : false)
    );
  }, [stock, q]);

  return (
    <div>
      <PageTitle>Buscar insumos</PageTitle>

      <InputGroup className="mb-3">
        <InputGroup.Text>🔎</InputGroup.Text>
        <Form.Control
          autoFocus
          placeholder="Escribe un insumo... (ej: agua, arroz)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button className="btn btn-outline-secondary" type="button" onClick={() => setQ("")}>
            ✕
          </button>
        )}
      </InputGroup>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Insumo</th>
                <th className="d-none d-sm-table-cell">Categoria</th>
                <th className="text-end">Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s) => (
                <tr
                  key={s.insumoId}
                  role="button"
                  onClick={() => setSeleccion(s)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="fw-medium">{s.nombre}</td>
                  <td className="d-none d-sm-table-cell text-secondary">{s.categoria ?? "-"}</td>
                  <td className="text-end">
                    {s.stock <= 0 ? (
                      <Badge bg="danger">{s.stock}</Badge>
                    ) : (
                      <span className="fw-semibold">
                        {s.stock} <small className="text-secondary">{s.unidadMedida}</small>
                      </span>
                    )}
                  </td>
                  <td className="text-end text-secondary">›</td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-secondary py-4">
                    {q ? `Sin resultados para "${q}"` : "No hay insumos"}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      <ModalMovimientos insumo={seleccion} onClose={() => setSeleccion(null)} />
    </div>
  );
}

function ModalMovimientos({
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
