import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, Button, Offcanvas } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

const enlacesBase = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/buscar", label: "Buscar" },
  { to: "/movimientos", label: "Movimientos" },
  { to: "/registrar", label: "Registrar" },
  { to: "/centros", label: "Centros" },
  { to: "/insumos", label: "Insumos" },
];

export default function Layout() {
  const { usuario, logout, gestionaUsuarios } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const enlaces = gestionaUsuarios
    ? [...enlacesBase, { to: "/usuarios", label: "Usuarios" }]
    : enlacesBase;

  function salir() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar expand="lg" variant="dark" className="bg-marca shadow-sm" sticky="top">
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/" className="fw-bold">
            RedAcopio
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="menu-lateral"
            onClick={() => setShow(true)}
          />
          <Navbar.Offcanvas
            id="menu-lateral"
            placement="end"
            show={show}
            onHide={() => setShow(false)}
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="flex-grow-1 gap-1">
                {enlaces.map((e) => (
                  <Nav.Link
                    key={e.to}
                    as={NavLink}
                    to={e.to}
                    end={e.end}
                    onClick={() => setShow(false)}
                    className="px-3 rounded"
                  >
                    {e.label}
                  </Nav.Link>
                ))}
              </Nav>
              <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                <span className="text-white-50 small">
                  {usuario?.nombre} · {usuario?.rol}
                </span>
                <Button size="sm" variant="light" onClick={salir}>
                  Salir
                </Button>
              </div>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>

      <main className="flex-fill py-3 py-lg-4">
        <Container>
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
