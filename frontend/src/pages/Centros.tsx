import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { api, apiError } from "../api/client";
import type { CentroAcopio } from "../types";
import { PageTitle } from "../components/ui";

export default function Centros() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ nombre: "", direccion: "", responsable: "", contacto: "" });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["centros"],
    queryFn: async () => (await api.get<CentroAcopio[]>("/centros")).data,
  });

  const crear = useMutation({
    mutationFn: async () => (await api.post("/centros", form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["centros"] });
      qc.invalidateQueries({ queryKey: ["resumen"] });
      setForm({ nombre: "", direccion: "", responsable: "", contacto: "" });
      setError("");
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <div>
      <PageTitle>Centros de acopio</PageTitle>

      <Row className="g-3">
        <Col xs={12} lg={4} className="order-lg-2">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h2 className="h6 mb-3">Nuevo centro</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    crear.mutate();
                  }}
                >
                  <Form.Group className="mb-2">
                    <Form.Label>Nombre *</Form.Label>
                    <Form.Control
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Direccion</Form.Label>
                    <Form.Control
                      value={form.direccion}
                      onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Responsable</Form.Label>
                    <Form.Control
                      value={form.responsable}
                      onChange={(e) => setForm({ ...form, responsable: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Contacto</Form.Label>
                    <Form.Control
                      value={form.contacto}
                      onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                    />
                  </Form.Group>
                  <div className="d-grid">
                    <Button type="submit" className="btn-marca" disabled={crear.isPending}>
                      {crear.isPending ? "Guardando..." : "Crear centro"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

        <Col xs={12} lg={8} className="order-lg-1">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {data?.map((c) => (
                <Card key={c.id} className="border-0 shadow-sm">
                  <Card.Body className="py-3">
                    <div className="fw-semibold">{c.nombre}</div>
                    <div className="text-secondary small">
                      {c.direccion && <span>{c.direccion} · </span>}
                      {c.responsable && <span>Resp: {c.responsable} · </span>}
                      {c.contacto && <span>{c.contacto}</span>}
                    </div>
                  </Card.Body>
                </Card>
              ))}
              {data?.length === 0 && <p className="text-secondary">No hay centros aun.</p>}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
