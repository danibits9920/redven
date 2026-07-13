import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Form, Button, Alert, Row, Col, ButtonGroup } from "react-bootstrap";
import { api, apiError } from "../api/client";
import type { CentroAcopio, Insumo, TipoMovimiento } from "../types";
import { PageTitle } from "../components/ui";

interface Linea {
  insumoId: string;
  porCaja: boolean;
  cantidad: string; // modo unidad
  cajas: string; // modo caja
  unidadesPorCaja: string; // modo caja
}

const lineaVacia: Linea = {
  insumoId: "",
  porCaja: false,
  cantidad: "",
  cajas: "",
  unidadesPorCaja: "",
};

function lineaValida(l: Linea) {
  if (!l.insumoId) return false;
  return l.porCaja
    ? Number(l.cajas) > 0 && Number(l.unidadesPorCaja) > 0
    : Number(l.cantidad) > 0;
}

export default function RegistrarMovimiento() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tipo, setTipo] = useState<TipoMovimiento>("ENTRADA");
  const [centroId, setCentroId] = useState("");
  const [origen, setOrigen] = useState("");
  const [nota, setNota] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([{ ...lineaVacia }]);
  const [error, setError] = useState("");

  const { data: centros } = useQuery({
    queryKey: ["centros"],
    queryFn: async () => (await api.get<CentroAcopio[]>("/centros")).data,
  });
  const { data: insumos } = useQuery({
    queryKey: ["insumos"],
    queryFn: async () => (await api.get<Insumo[]>("/insumos")).data,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const items = lineas.filter(lineaValida).map((l) =>
        l.porCaja
          ? {
              insumoId: l.insumoId,
              porCaja: true,
              cajas: Number(l.cajas),
              unidadesPorCaja: Number(l.unidadesPorCaja),
            }
          : { insumoId: l.insumoId, cantidad: Number(l.cantidad) }
      );
      const payload = {
        tipo,
        centroId: tipo === "SALIDA" ? centroId : null,
        origen: origen || undefined,
        nota: nota || undefined,
        items,
      };
      return (await api.post("/movimientos", payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumen"] });
      qc.invalidateQueries({ queryKey: ["movimientos"] });
      qc.invalidateQueries({ queryKey: ["stock-buscar"] });
      navigate("/movimientos");
    },
    onError: (err) => setError(apiError(err)),
  });

  function editar(i: number, cambios: Partial<Linea>) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...cambios } : l)));
  }

  // Al elegir insumo, precargamos sus unidades por caja (si tiene).
  function elegirInsumo(i: number, insumoId: string) {
    const ins = insumos?.find((x) => x.id === insumoId);
    editar(i, {
      insumoId,
      unidadesPorCaja: ins?.unidadesPorCaja ? String(ins.unidadesPorCaja) : "",
      porCaja: ins?.unidadesPorCaja ? lineas[i].porCaja : false,
    });
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, { ...lineaVacia }]);
  }
  function quitarLinea(i: number) {
    setLineas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (lineas.filter(lineaValida).length === 0)
      return setError("Agrega al menos un insumo con cantidad.");
    if (tipo === "SALIDA" && !centroId) return setError("Selecciona el centro destino.");
    mutation.mutate();
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <PageTitle>Registrar movimiento</PageTitle>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-3 p-md-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={enviar}>
            {/* Tipo de movimiento */}
            <Row className="g-2 mb-3">
              <Col xs={6}>
                <Button
                  type="button"
                  variant={tipo === "ENTRADA" ? "success" : "outline-secondary"}
                  className="w-100"
                  onClick={() => setTipo("ENTRADA")}
                >
                  ENTRADA
                  <div className="small fw-normal">llega al almacen</div>
                </Button>
              </Col>
              <Col xs={6}>
                <Button
                  type="button"
                  variant={tipo === "SALIDA" ? "warning" : "outline-secondary"}
                  className="w-100"
                  onClick={() => setTipo("SALIDA")}
                >
                  SALIDA
                  <div className="small fw-normal">distribuir a centro</div>
                </Button>
              </Col>
            </Row>

            {tipo === "SALIDA" ? (
              <Form.Group className="mb-3">
                <Form.Label>Centro de acopio destino</Form.Label>
                <Form.Select value={centroId} onChange={(e) => setCentroId(e.target.value)}>
                  <option value="">Selecciona...</option>
                  {centros?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>Origen / procedencia (opcional)</Form.Label>
                <Form.Control
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  placeholder="Ej: Donacion internacional"
                />
              </Form.Group>
            )}

            <Form.Label>Insumos</Form.Label>
            <div className="d-flex flex-column gap-2 mb-2">
              {lineas.map((l, i) => {
                const total = Number(l.cajas) * Number(l.unidadesPorCaja);
                const insumo = insumos?.find((x) => x.id === l.insumoId);
                return (
                  <div key={i} className="border rounded p-2">
                    <div className="d-flex gap-2 mb-2">
                      <Form.Select
                        value={l.insumoId}
                        onChange={(e) => elegirInsumo(i, e.target.value)}
                      >
                        <option value="">Insumo...</option>
                        {insumos?.map((ins) => (
                          <option key={ins.id} value={ins.id}>
                            {ins.nombre} ({ins.unidadMedida})
                          </option>
                        ))}
                      </Form.Select>
                      <Button
                        variant="outline-danger"
                        onClick={() => quitarLinea(i)}
                        disabled={lineas.length === 1}
                      >
                        ✕
                      </Button>
                    </div>

                    {/* Selector Unidad / Caja */}
                    <ButtonGroup size="sm" className="mb-2">
                      <Button
                        variant={l.porCaja ? "outline-secondary" : "secondary"}
                        onClick={() => editar(i, { porCaja: false })}
                      >
                        Por unidad
                      </Button>
                      <Button
                        variant={l.porCaja ? "secondary" : "outline-secondary"}
                        onClick={() => editar(i, { porCaja: true })}
                      >
                        Por caja
                      </Button>
                    </ButtonGroup>

                    {l.porCaja ? (
                      <Row className="g-2 align-items-center">
                        <Col xs={6} sm={4}>
                          <Form.Control
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            placeholder="Cajas"
                            value={l.cajas}
                            onChange={(e) => editar(i, { cajas: e.target.value })}
                          />
                          <Form.Text>cajas</Form.Text>
                        </Col>
                        <Col xs={6} sm={4}>
                          <Form.Control
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="Unid/caja"
                            value={l.unidadesPorCaja}
                            onChange={(e) => editar(i, { unidadesPorCaja: e.target.value })}
                          />
                          <Form.Text>unid. por caja</Form.Text>
                        </Col>
                        <Col xs={12} sm={4}>
                          <div className="text-marca fw-semibold small">
                            = {total > 0 ? total : 0} {insumo?.unidadMedida ?? "unid."}
                          </div>
                        </Col>
                      </Row>
                    ) : (
                      <Row className="g-2">
                        <Col xs={6}>
                          <Form.Control
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            placeholder="Cantidad"
                            value={l.cantidad}
                            onChange={(e) => editar(i, { cantidad: e.target.value })}
                          />
                        </Col>
                        <Col xs={6} className="d-flex align-items-center">
                          <span className="text-secondary small">
                            {insumo?.unidadMedida ?? "unidades"}
                          </span>
                        </Col>
                      </Row>
                    )}
                  </div>
                );
              })}
            </div>
            <Button variant="link" className="px-0 mb-3 text-marca" onClick={agregarLinea}>
              + Agregar insumo
            </Button>

            <Form.Group className="mb-4">
              <Form.Label>Nota (opcional)</Form.Label>
              <Form.Control value={nota} onChange={(e) => setNota(e.target.value)} />
            </Form.Group>

            <div className="d-grid d-sm-flex gap-2">
              <Button type="submit" className="btn-marca" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Registrar"}
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => navigate("/movimientos")}
              >
                Cancelar
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
