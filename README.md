# RedAcopio

Sistema para gestionar insumos de ayuda humanitaria: registra lo que **llega al
almacen** (entradas) y a **que centros de acopio se distribuye** (salidas), con
trazabilidad completa y calculo automatico de stock.

## Como funciona el modelo

```
   Donaciones / cargamentos
            │  ENTRADA
            ▼
      ┌───────────┐        SALIDA (distribucion)
      │  ALMACEN  │──────────────┬───────────┬───────────┐
      └───────────┘              ▼           ▼           ▼
       stock = Σentradas    Centro A     Centro B     Centro C
                − Σsalidas
```

- El **stock nunca se edita**: se calcula desde los movimientos (auditable).
- No se puede distribuir mas de lo que hay en el almacen.
- **2 roles**: ADMIN (gestiona catalogos y usuarios) y OPERADOR (registra).

## Requisitos

- Node.js 18+
- Docker (para la base de datos PostgreSQL local)

## Arrancar en local

### 1. Base de datos

```bash
# En la raiz del proyecto
sudo docker-compose up -d      # levanta PostgreSQL en localhost:5432
```

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev         # crea las tablas (solo la primera vez)
npm run seed                   # datos de ejemplo (opcional)
npm run dev                    # API en http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                    # app en http://localhost:5173
```

Abre **http://localhost:5173** e ingresa con un usuario de ejemplo.

## Usuarios de ejemplo (tras el seed)

| Email                     | Contrasena  | Rol      |
| ------------------------- | ----------- | -------- |
| admin@redacopio.org       | password123 | ADMIN    |
| operador1@redacopio.org   | password123 | OPERADOR |
| operador2@redacopio.org   | password123 | OPERADOR |

> Cambia estas credenciales antes de usar en produccion.

## Estructura

```
crudinsumos/
├── docker-compose.yml     # PostgreSQL local
├── backend/               # API Node + Express + Prisma
│   ├── prisma/schema.prisma
│   └── src/
│       ├── routes/        # auth, usuarios, centros, insumos, movimientos, reportes
│       ├── middleware/    # auth JWT + roles
│       └── services/      # calculo de stock
└── frontend/              # React + Vite + Tailwind + TanStack Query
    └── src/
        ├── pages/         # Login, Dashboard, Movimientos, Registrar, Centros, Insumos
        ├── components/    # Layout, UI
        └── auth/          # contexto de autenticacion
```

## Endpoints principales

```
POST /api/auth/login              login
GET  /api/auth/me                 usuario actual
GET/POST/PUT /api/usuarios        gestion de usuarios (ADMIN)
GET/POST/PUT /api/centros         centros de acopio
GET/POST/PUT /api/insumos         catalogo de insumos
GET/POST /api/movimientos         registrar/listar entradas y salidas
GET  /api/reportes/stock          stock actual del almacen
GET  /api/reportes/centros/:id    que ha recibido cada centro
GET  /api/reportes/resumen        numeros del dashboard
```

## Despliegue (Render)

El proyecto usa PostgreSQL estandar, asi que despliega sin cambios de codigo:

1. Crea una base PostgreSQL (en Render o Neon) y copia su `DATABASE_URL`.
2. Backend: servicio web en Render con `npm install && npx prisma migrate deploy`
   como build y `npm start` como arranque. Variables: `DATABASE_URL`, `JWT_SECRET`,
   `CORS_ORIGIN` (la URL del frontend).
3. Frontend: sitio estatico en Render con build `npm run build`, publica `dist/`.
   Variable `VITE_API_URL` apuntando a la URL del backend.
