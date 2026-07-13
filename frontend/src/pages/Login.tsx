import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Button, Alert, Container } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";
import { apiError } from "../api/client";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@redacopio.org");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <Container
      className="d-flex align-items-center justify-content-center min-vh-100 px-3"
      style={{ maxWidth: 440 }}
    >
      <Card className="shadow-sm w-100 border-0">
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h1 className="h3 fw-bold text-marca mb-1">RedAcopio</h1>
            <p className="text-secondary small mb-0">
              Gestion de insumos y centros de acopio
            </p>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={enviar}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Contrasena</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Form.Group>
            <Button type="submit" className="btn-marca w-100" disabled={cargando}>
              {cargando ? "Ingresando..." : "Ingresar"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
