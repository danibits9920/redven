import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { BadRequest, NotFound, Forbidden } from "../lib/errors";
import { requireAuth, requireRole } from "../middleware/auth";
import { Rol } from "@prisma/client";

export const usuariosRouter = Router();

// Gestionar usuarios: solo ADMIN y SUPERIOR.
usuariosRouter.use(requireAuth, requireRole(Rol.ADMIN, Rol.SUPERIOR));

const selectPublico = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  createdAt: true,
} as const;

// GET /api/usuarios
usuariosRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const usuarios = await prisma.usuario.findMany({
      select: selectPublico,
      orderBy: { createdAt: "asc" },
    });
    res.json(usuarios);
  })
);

const crearSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
  rol: z.nativeEnum(Rol).default(Rol.OPERADOR),
});

// POST /api/usuarios
usuariosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = crearSchema.safeParse(req.body);
    if (!parsed.success) throw BadRequest(parsed.error.issues[0].message);
    const { nombre, email, password, rol } = parsed.data;

    // Solo un ADMIN puede crear administradores.
    if (rol === Rol.ADMIN && req.usuario!.rol !== Rol.ADMIN) {
      throw Forbidden("Solo un administrador puede crear administradores");
    }

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) throw BadRequest("Ya existe un usuario con ese email");

    const usuario = await prisma.usuario.create({
      data: { nombre, email, passwordHash: await hashPassword(password), rol },
      select: selectPublico,
    });
    res.status(201).json(usuario);
  })
);

const actualizarSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  rol: z.nativeEnum(Rol).optional(),
  activo: z.boolean().optional(),
});

// PUT /api/usuarios/:id
usuariosRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = actualizarSchema.safeParse(req.body);
    if (!parsed.success) throw BadRequest(parsed.error.issues[0].message);

    const existe = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!existe) throw NotFound("Usuario no encontrado");

    // Jerarquia: solo un ADMIN puede editar a un administrador o ascender a alguien a admin.
    const soyAdmin = req.usuario!.rol === Rol.ADMIN;
    if (!soyAdmin) {
      if (existe.rol === Rol.ADMIN) {
        throw Forbidden("Solo un administrador puede editar a otro administrador");
      }
      if (parsed.data.rol === Rol.ADMIN) {
        throw Forbidden("Solo un administrador puede asignar el rol de administrador");
      }
    }

    // Proteccion: no permitir bloquearte a ti mismo (evita quedar sin acceso).
    if (req.params.id === req.usuario!.id) {
      if (parsed.data.rol && parsed.data.rol !== existe.rol) {
        throw BadRequest("No puedes cambiar tu propio rol");
      }
      if (parsed.data.activo === false) {
        throw BadRequest("No puedes desactivar tu propia cuenta");
      }
    }

    const { password, ...resto } = parsed.data;
    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data: {
        ...resto,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
      select: selectPublico,
    });
    res.json(usuario);
  })
);

export { usuariosRouter as default };
