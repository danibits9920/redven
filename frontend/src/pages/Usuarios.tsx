import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Row, Col, Card, Form, Button, Alert, Table, Spinner, Badge } from "react-bootstrap";
import { api, apiError } from "../api/client";
import { ROL_LABEL, type Rol, type Usuario } from "../types";
import { useAuth } from "../auth/AuthContext";
import { PageTitle } from "../components/ui";

const ROLES: Rol[] = ["ADMIN", "SUPERIOR", "OPERADOR"];
// Un superior no puede asignar el rol de administrador.
const rolesAsignables = (soyAdmin: boolean): Rol[] =>
  soyAdmin ? ROLES : ROLES.filter((r) => r !== "ADMIN");

function BadgeRol({ rol }: { rol: Rol }) {
  const color = rol === "ADMIN" ? "danger" : rol === "SUPERIOR" ? "primary" : "secondary";
  return <Badge bg={color}>{ROL_LABEL[rol]}</Badge>;
}

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const soyAdmin = yo?.rol === "ADMIN";
  const qc = useQueryClient();
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "OPERADOR" as Rol });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await api.get<Usuario[]>("/usuarios")).data,
  });

  const crear = useMutation({
    mutationFn: async () => (await api.post("/usuarios", form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      setForm({ nombre: "", email: "", password: "", rol: "OPERADOR" });
      setError("");
    },
    onError: (err) => setError(apiError(err)),
  });

  const actualizar = useMutation({
    mutationFn: async ({ id, cambios }: { id: string; cambios: Partial<Usuario> }) =>
      (await api.put(`/usuarios/${id}`, cambios)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
    onError: (err) => setError(apiError(err)),
  });

  return (
    <div>
      <PageTitle>Usuarios</PageTitle>

      <Row className="g-3">
        {/* Formulario de nuevo usuario */}
        <Col xs={12} lg={4} className="order-lg-2">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h2 className="h6 mb-3">Nuevo usuario</h2>
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
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Contrasena *</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimo 6 caracteres"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
                  >
                    {rolesAsignables(soyAdmin).map((r) => (
                      <option key={r} value={r}>
                        {ROL_LABEL[r]}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-secondary">
                    Administrador y Superior pueden gestionar usuarios. Normal hace todo
                    excepto eso.
                  </Form.Text>
                </Form.Group>
                <div className="d-grid">
                  <Button type="submit" className="btn-marca" disabled={crear.isPending}>
                    {crear.isPending ? "Guardando..." : "Crear usuario"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Lista de usuarios */}
        <Col xs={12} lg={8} className="order-lg-1">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th className="d-none d-sm-table-cell">Email</th>
                    <th>Rol</th>
                    <th className="text-end">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((u) => {
                    const soyYo = u.id === yo?.id;
                    // Un superior no puede editar administradores; nadie se edita a si mismo aqui.
                    const editable = !soyYo && (soyAdmin || u.rol !== "ADMIN");
                    return (
                      <tr key={u.id}>
                        <td className="fw-medium">
                          {u.nombre}
                          {soyYo && <span className="text-secondary small"> (tu)</span>}
                        </td>
                        <td className="d-none d-sm-table-cell text-secondary">{u.email}</td>
                        <td>
                          {editable ? (
                            <Form.Select
                              size="sm"
                              value={u.rol}
                              style={{ minWidth: 130 }}
                              onChange={(e) =>
                                actualizar.mutate({
                                  id: u.id,
                                  cambios: { rol: e.target.value as Rol },
                                })
                              }
                            >
                              {rolesAsignables(soyAdmin).map((r) => (
                                <option key={r} value={r}>
                                  {ROL_LABEL[r]}
                                </option>
                              ))}
                            </Form.Select>
                          ) : (
                            <BadgeRol rol={u.rol} />
                          )}
                        </td>
                        <td className="text-end">
                          {editable ? (
                            <Button
                              size="sm"
                              variant={u.activo ? "outline-danger" : "outline-success"}
                              onClick={() =>
                                actualizar.mutate({
                                  id: u.id,
                                  cambios: { activo: !u.activo },
                                })
                              }
                            >
                              {u.activo ? "Desactivar" : "Activar"}
                            </Button>
                          ) : (
                            <Badge bg={u.activo ? "success" : "secondary"}>
                              {u.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
