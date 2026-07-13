import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Row, Col, Card, Form, Button, Alert, Table, Spinner } from "react-bootstrap";
import { api, apiError } from "../api/client";
import type { Insumo } from "../types";
import { PageTitle } from "../components/ui";

export default function Insumos() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    unidadMedida: "unidad",
    unidadesPorCaja: "",
  });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["insumos"],
    queryFn: async () => (await api.get<Insumo[]>("/insumos")).data,
  });

  const crear = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: form.nombre,
        categoria: form.categoria || undefined,
        unidadMedida: form.unidadMedida || "unidad",
        unidadesPorCaja: form.unidadesPorCaja ? Number(form.unidadesPorCaja) : null,
      };
      return (await api.post("/insumos", payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insumos"] });
      qc.invalidateQueries({ queryKey: ["resumen"] });
      setForm({ nombre: "", categoria: "", unidadMedida: "unidad", unidadesPorCaja: "" });
      setError("");
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <div>
      <PageTitle>Insumos</PageTitle>

      <Row className="g-3">
        <Col xs={12} lg={4} className="order-lg-2">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h2 className="h6 mb-3">Nuevo insumo</h2>
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
                    <Form.Label>Categoria</Form.Label>
                    <Form.Control
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      placeholder="Alimentos, Higiene, Medicinas..."
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Unidad de medida</Form.Label>
                    <Form.Control
                      value={form.unidadMedida}
                      onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })}
                      placeholder="kg, litros, unidad, caja"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Unidades por caja (opcional)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={form.unidadesPorCaja}
                      onChange={(e) => setForm({ ...form, unidadesPorCaja: e.target.value })}
                      placeholder="Ej: 24"
                    />
                    <Form.Text className="text-secondary">
                      Si se maneja por cajas, cuantas unidades trae una caja.
                    </Form.Text>
                  </Form.Group>
                  <div className="d-grid">
                    <Button type="submit" className="btn-marca" disabled={crear.isPending}>
                      {crear.isPending ? "Guardando..." : "Crear insumo"}
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
            <Card className="border-0 shadow-sm">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th className="d-none d-sm-table-cell">Categoria</th>
                    <th>Unidad</th>
                    <th className="text-end">Unid/caja</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((i) => (
                    <tr key={i.id}>
                      <td className="fw-medium">{i.nombre}</td>
                      <td className="d-none d-sm-table-cell text-secondary">
                        {i.categoria ?? "-"}
                      </td>
                      <td className="text-secondary">{i.unidadMedida}</td>
                      <td className="text-end text-secondary">
                        {i.unidadesPorCaja ? i.unidadesPorCaja : "-"}
                      </td>
                    </tr>
                  ))}
                  {data?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-secondary py-4">
                        No hay insumos aun
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
