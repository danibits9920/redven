import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

// Crea (o asegura) el usuario administrador inicial en produccion.
// Toma las credenciales de las variables de entorno ADMIN_EMAIL / ADMIN_PASSWORD.
// Es idempotente: si el admin ya existe, NO cambia su contrasena.
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL/ADMIN_PASSWORD no definidos; se omite la creacion del admin.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.usuario.upsert({
    where: { email },
    update: {}, // si ya existe, no tocamos nada (no piso el password)
    create: {
      nombre: "Administrador",
      email,
      passwordHash,
      rol: Rol.ADMIN,
    },
  });

  console.log(`Admin asegurado: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
