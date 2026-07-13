import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { Unauthorized, Forbidden } from "../lib/errors";
import { Rol } from "@prisma/client";

// Verifica el token JWT del header Authorization y carga el usuario.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw Unauthorized("Falta el token de autenticacion");
    }
    const token = header.slice(7);
    const payload = verifyToken(token);

    // Verificamos que el usuario siga existiendo y activo.
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, rol: true, nombre: true, activo: true },
    });
    if (!usuario || !usuario.activo) {
      throw Unauthorized("Usuario invalido o inactivo");
    }

    req.usuario = { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre };
    next();
  } catch (err) {
    if ((err as Error).name === "JsonWebTokenError" || (err as Error).name === "TokenExpiredError") {
      return next(Unauthorized("Token invalido o expirado"));
    }
    next(err);
  }
}

// Restringe el acceso a ciertos roles. Usar despues de requireAuth.
export function requireRole(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) return next(Unauthorized());
    if (!roles.includes(req.usuario.rol)) {
      return next(Forbidden("No tienes permiso para esta accion"));
    }
    next();
  };
}
