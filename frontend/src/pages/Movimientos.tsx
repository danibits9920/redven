import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Row, Col, Form, Card, Badge, Spinner, Button } from "react-bootstrap";
import { api } from "../api/client";
import type { Movimiento, CentroAcopio } from "../types";
import { PageTitle, MovBadge, textoCantidad } from "../components/ui";

async function fetchMovimientos(params: Record<string, string>): Promise<Movimiento[]> {
  const { data } = await api.get("/movimientos", { params });
  return data;
}

async function fetchCentros(): Promise<CentroAcopio[]> {
  const { data } = await api.get("/centros");
  return data;
}

export default function Movimientos() {
  const [tipo, setTipo] = useState("");
  const [centroId, setCentroId] = useState("");

  const params: Record<string, string> = {};
  if (tipo) params.tipo = tipo;
  if (centroId) params.centroId = centroId;

  const { data: centros } = useQuery({ queryKey: ["centros"], queryFn: fetchCentros });
  const { data, isLoading } = useQuery({
    queryKey: ["movimientos", tipo, centroId],
    queryFn: () => fetchMovimientos(params),
  });

  return (
    <div>
      <PageTitle
        action={
          <Button as={Link as any} to="/registrar" className="btn-marca btn-sm">
            + Registrar
          </Button>
        }
      >
        Movimientos
      </PageTitle>

      <Row className="g-2 mb-3">
        <Col xs={6}>
          <Form.Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
          </Form.Select>
        </Col>
        <Col xs={6}>
          <Form.Select value={centroId} onChange={(e) => setCentroId(e.target.value)}>
            <option value="">Todos los centros</option>
            {centros?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {data?.map((m) => (
            <Card key={m.id} className="border-0 shadow-sm">
              <Card.Body className="py-3">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <MovBadge tipo={m.tipo} />
                    <span className="small text-body-secondary">
                      {m.tipo === "ENTRADA"
                        ? `Almacen${m.origen ? ` · ${m.origen}` : ""}`
                        : `→ ${m.centro?.nombre ?? ""}`}
                    </span>
                  </div>
                  <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                    {new Date(m.fecha).toLocaleDateString()} · {m.usuario?.nombre}
                  </span>
                </div>
                <div className="d-flex flex-wrap gap-1">
                  {m.items.map((it) => (
                    <Badge key={it.id} bg="light" text="dark" className="border fw-normal">
                      {it.insumo?.nombre}: {textoCantidad(it)}
                    </Badge>
                  ))}
                </div>
                {m.nota && <p className="text-secondary small mb-0 mt-2">{m.nota}</p>}
              </Card.Body>
            </Card>
          ))}
          {data?.length === 0 && <p className="text-secondary">No hay movimientos.</p>}
        </div>
      )}
    </div>
  );
}
