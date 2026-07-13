import { Rol } from "@prisma/client";

// Extiende Request para llevar el usuario autenticado.
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        rol: Rol;
        nombre: string;
      };
    }
  }
}

export {};
