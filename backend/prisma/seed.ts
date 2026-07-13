import { PrismaClient, Rol, TipoMovimiento } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando datos de ejemplo...");

  // --- Usuarios (las 3 personas que gestionan) ---
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@redacopio.org" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@redacopio.org",
      passwordHash,
      rol: Rol.ADMIN,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "operador1@redacopio.org" },
    update: {},
    create: {
      nombre: "Operador Uno",
      email: "operador1@redacopio.org",
      passwordHash,
      rol: Rol.OPERADOR,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "operador2@redacopio.org" },
    update: {},
    create: {
      nombre: "Operador Dos",
      email: "operador2@redacopio.org",
      passwordHash,
      rol: Rol.OPERADOR,
    },
  });

  // --- Centros de acopio (destinos de distribucion) ---
  const centroCaracas = await prisma.centroAcopio.create({
    data: {
      nombre: "Centro Caracas - Petare",
      direccion: "Petare, Caracas",
      responsable: "Maria Gonzalez",
      contacto: "0412-0000001",
    },
  });

  const centroMaracaibo = await prisma.centroAcopio.create({
    data: {
      nombre: "Centro Maracaibo",
      direccion: "Maracaibo, Zulia",
      responsable: "Jose Perez",
      contacto: "0414-0000002",
    },
  });

  // --- Insumos (catalogo) ---
  const [arroz, agua, jabon, medicinas] = await Promise.all([
    prisma.insumo.create({
      data: { nombre: "Arroz", categoria: "Alimentos", unidadMedida: "kg" },
    }),
    prisma.insumo.create({
      data: { nombre: "Agua potable", categoria: "Agua", unidadMedida: "litros" },
    }),
    prisma.insumo.create({
      data: { nombre: "Jabon", categoria: "Higiene", unidadMedida: "unidad" },
    }),
    prisma.insumo.create({
      data: { nombre: "Kit medico basico", categoria: "Medicinas", unidadMedida: "caja" },
    }),
  ]);

  // --- ENTRADA: llega un cargamento al almacen (centroId = null) ---
  await prisma.movimiento.create({
    data: {
      tipo: TipoMovimiento.ENTRADA,
      centroId: null,
      usuarioId: admin.id,
      origen: "Donacion internacional",
      nota: "Cargamento inicial al almacen",
      items: {
        create: [
          { insumoId: arroz.id, cantidad: 1000 },
          { insumoId: agua.id, cantidad: 500 },
          { insumoId: jabon.id, cantidad: 200 },
          { insumoId: medicinas.id, cantidad: 30 },
        ],
      },
    },
  });

  // --- SALIDA: distribucion del almacen al Centro Caracas ---
  await prisma.movimiento.create({
    data: {
      tipo: TipoMovimiento.SALIDA,
      centroId: centroCaracas.id,
      usuarioId: admin.id,
      nota: "Distribucion a Caracas",
      items: {
        create: [
          { insumoId: arroz.id, cantidad: 300 },
          { insumoId: agua.id, cantidad: 200 },
        ],
      },
    },
  });

  // --- SALIDA: distribucion del almacen al Centro Maracaibo ---
  await prisma.movimiento.create({
    data: {
      tipo: TipoMovimiento.SALIDA,
      centroId: centroMaracaibo.id,
      usuarioId: admin.id,
      nota: "Distribucion a Maracaibo",
      items: {
        create: [
          { insumoId: arroz.id, cantidad: 200 },
          { insumoId: jabon.id, cantidad: 100 },
          { insumoId: medicinas.id, cantidad: 10 },
        ],
      },
    },
  });

  console.log("Datos de ejemplo sembrados correctamente.");
  console.log("");
  console.log("Stock esperado en almacen tras el seed:");
  console.log("  Arroz: 1000 - 300 - 200 = 500 kg");
  console.log("  Agua:  500 - 200       = 300 litros");
  console.log("  Jabon: 200 - 100       = 100 unidad");
  console.log("  Kit medico: 30 - 10    = 20 caja");
  console.log("");
  console.log("Login de prueba:");
  console.log("  admin@redacopio.org     / password123 (ADMIN)");
  console.log("  operador1@redacopio.org / password123 (OPERADOR)");
  console.log("  operador2@redacopio.org / password123 (OPERADOR)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
