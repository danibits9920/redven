import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Buscar from "./pages/Buscar";
import Movimientos from "./pages/Movimientos";
import RegistrarMovimiento from "./pages/RegistrarMovimiento";
import Centros from "./pages/Centros";
import Insumos from "./pages/Insumos";
import Usuarios from "./pages/Usuarios";

export default function App() {
  const { usuario, gestionaUsuarios } = useAuth();

  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/buscar" element={<Buscar />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/registrar" element={<RegistrarMovimiento />} />
        <Route path="/centros" element={<Centros />} />
        <Route path="/insumos" element={<Insumos />} />
        <Route
          path="/usuarios"
          element={gestionaUsuarios ? <Usuarios /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
