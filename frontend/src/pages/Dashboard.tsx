import { useQuery } from "@tanstack/react-query";
import { Row, Col, Card, Table, Spinner, Alert, Badge } from "react-bootstrap";
import { api } from "../api/client";
import type { Resumen } from "../types";
import { PageTitle } from "../components/ui";

async function fetchResumen(): Promise<Resumen> {
  const { data } = await api.get("/reportes/resumen");
  return data;
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

      <h2 className="h6 text-secondary mb-2">Stock actual del almacen</h2>
      <Card className="border-0 shadow-sm">
        <Table responsive hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th>Insumo</th>
              <th className="d-none d-sm-table-cell">Categoria</th>
              <th className="text-end">Stock</th>
              <th>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {data.stock.map((s) => (
              <tr key={s.insumoId}>
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
              </tr>
            ))}
            {data.stock.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-secondary py-4">
                  Sin insumos aun
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
