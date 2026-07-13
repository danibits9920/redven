import { PrismaClient } from "@prisma/client";

// Cliente Prisma unico y reutilizable en toda la app.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error", "warn"],
});
