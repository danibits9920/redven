import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Row, Col, Card, Table, Spinner, Alert, Badge, Form, InputGroup } from "react-bootstrap";
import { api } from "../api/client";
import type { Resumen, StockItem } from "../types";
import { PageTitle } from "../components/ui";
import ModalMovimientosInsumo from "../components/ModalMovimientosInsumo";

async function fetchResumen(): Promise<Resumen> {
  const { data } = await api.get("/reportes/resumen");
  return data;
}

// Normaliza para buscar sin importar mayusculas ni acentos.
function normalizar(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body>
        <div className="display-6 fw-bold text-marca">{value}</div>
        <div className="text-secondary small">{label}</div>
      </Card.Body>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["resumen"], queryFn: fetchResumen });
  const [q, setQ] = useState("");
  const [seleccion, setSeleccion] = useState<StockItem | null>(null);

  const filtrados = useMemo(() => {
    const stock = data?.stock ?? [];
    const term = normalizar(q.trim());
    if (!term) return stock;
    return stock.filter(
      (s) =>
        normalizar(s.nombre).includes(term) ||
        (s.categoria ? normalizar(s.categoria).includes(term) : false)
    );
  }, [data, q]);

  if (isLoading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  if (isError || !data) return <Alert variant="danger">Error al cargar el dashboard.</Alert>;

  return (
    <div>
      <PageTitle>Dashboard</PageTitle>

      <Row className="g-3 mb-4">
        <Col xs={4}>
          <Stat label="Centros" value={data.totalCentros} />
        </Col>
        <Col xs={4}>
          <Stat label="Insumos" value={data.totalInsumos} />
        </Col>
        <Col xs={4}>
          <Stat label="Movimientos" value={data.totalMovimientos} />
        </Col>
      </Row>

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <h2 className="h6 text-secondary mb-0">Stock del almacen</h2>
        <span className="text-secondary small">Toca un insumo para ver sus movimientos</span>
      </div>

      {/* Buscador integrado sobre la tabla de stock */}
      <InputGroup className="mb-3">
        <InputGroup.Text>🔎</InputGroup.Text>
        <Form.Control
          placeholder="Buscar insumo... (ej: agua, arroz)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button className="btn btn-outline-secondary" type="button" onClick={() => setQ("")}>
            ✕
          </button>
        )}
      </InputGroup>

      <Card className="border-0 shadow-sm">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>Insumo</th>
              <th className="d-none d-sm-table-cell">Categoria</th>
              <th className="text-end">Stock</th>
              <th>Unidad</th>
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
                    <span className="fw-semibold">{s.stock}</span>
                  )}
                </td>
                <td className="text-secondary">{s.unidadMedida}</td>
                <td className="text-end text-secondary">›</td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-secondary py-4">
                  {q ? `Sin resultados para "${q}"` : "Sin insumos aun"}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      <ModalMovimientosInsumo insumo={seleccion} onClose={() => setSeleccion(null)} />
    </div>
  );
}
