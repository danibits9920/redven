import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyPassword, signToken } from "../lib/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { BadRequest, Unauthorized } from "../lib/errors";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});

// POST /api/auth/login
authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw BadRequest(parsed.error.issues[0].message);
    }
    const { email, password } = parsed.data;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      throw Unauthorized("Credenciales invalidas");
    }
    const ok = await verifyPassword(password, usuario.passwordHash);
    if (!ok) {
      throw Unauthorized("Credenciales invalidas");
    }

    const token = signToken({ sub: usuario.id, rol: usuario.rol, nombre: usuario.nombre });
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  })
);

// GET /api/auth/me
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario!.id },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    res.json({ usuario });
  })
);
