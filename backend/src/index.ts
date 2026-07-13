import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { ApiError } from "./lib/errors";
import { authRouter } from "./routes/auth.routes";
import { usuariosRouter } from "./routes/usuarios.routes";
import { centrosRouter } from "./routes/centros.routes";
import { insumosRouter } from "./routes/insumos.routes";
import { movimientosRouter } from "./routes/movimientos.routes";
import { reportesRouter } from "./routes/reportes.routes";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

// Health check: util para Render y para verificar que la BD responde.
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "conectada" });
  } catch (err) {
    res.status(503).json({ status: "error", db: "sin conexion" });
  }
});

app.get("/", (_req, res) => {
  res.json({ app: "RedAcopio API", version: "0.1.0" });
});

// Rutas de la API
app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/centros", centrosRouter);
app.use("/api/insumos", insumosRouter);
app.use("/api/movimientos", movimientosRouter);
app.use("/api/reportes", reportesRouter);

// 404 para rutas de API no encontradas
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Manejador de errores global
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
);

app.listen(env.port, () => {
  console.log(`RedAcopio API escuchando en http://localhost:${env.port}`);
});
