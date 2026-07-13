# Guia de despliegue en Render

Esta guia sube RedAcopio a internet usando el archivo `render.yaml` (Blueprint),
que crea la base de datos, el backend y el frontend automaticamente.

## Requisitos previos

- Una cuenta de **GitHub** (gratis): https://github.com
- Una cuenta de **Render** (gratis): https://render.com

---

## Paso 1 — Subir el codigo a GitHub

El repositorio git ya esta inicializado localmente con el primer commit. Falta
subirlo a GitHub:

1. Entra a https://github.com/new y crea un repositorio **vacio** (sin README),
   por ejemplo `redacopio`. Puede ser privado.
2. GitHub te mostrara unos comandos. Usa los de "push an existing repository".
   En tu terminal, dentro de la carpeta del proyecto:

   ```bash
   cd /home/daltex/Escritorio/crudinsumos
   git remote add origin https://github.com/TU_USUARIO/redacopio.git
   git branch -M main
   git push -u origin main
   ```

   (Te pedira tu usuario y un token de GitHub. Si no tienes token:
   GitHub -> Settings -> Developer settings -> Personal access tokens ->
   "Tokens (classic)" -> Generate, con permiso `repo`.)

---

## Paso 2 — Crear los servicios en Render

1. Entra a https://dashboard.render.com y conecta tu cuenta de GitHub.
2. Click en **New +** -> **Blueprint**.
3. Selecciona el repositorio `redacopio`. Render detectara el `render.yaml`.
4. Render te pedira llenar las variables marcadas (porque dependen de las URLs).
   Puedes poner valores provisionales y ajustarlos en el Paso 3:
   - **ADMIN_EMAIL**: el correo del administrador (ej: `admin@tudominio.org`)
   - **ADMIN_PASSWORD**: una contrasena segura para el admin
   - **CORS_ORIGIN**: dejalo provisional (ej: `https://redacopio-web.onrender.com`)
   - **VITE_API_URL**: dejalo provisional (ej: `https://redacopio-api.onrender.com/api`)
5. Click en **Apply**. Render crea la base de datos, el backend y el frontend.

---

## Paso 3 — Conectar frontend y backend (URLs reales)

Cuando terminen de crearse, Render te dara las URLs reales de cada servicio
(arriba de cada servicio, algo como `https://redacopio-api-xxxx.onrender.com`).

1. Copia la URL del **backend** (`redacopio-api`).
2. Copia la URL del **frontend** (`redacopio-web`).
3. En el servicio **redacopio-api** -> Environment, ajusta:
   - `CORS_ORIGIN` = la URL del **frontend** (sin `/` al final)
4. En el servicio **redacopio-web** -> Environment, ajusta:
   - `VITE_API_URL` = la URL del **backend** + `/api`
5. Guarda. Render volvera a desplegar ambos con las URLs correctas.

---

## Paso 4 — Entrar

Abre la URL del frontend en tu telefono o navegador e ingresa con el
`ADMIN_EMAIL` y `ADMIN_PASSWORD` que definiste. Desde ahi, como ADMIN, puedes
crear los demas usuarios (las otras 2 personas), los centros y los insumos.

---

## Notas

- **Plan free**: los servicios "se duermen" tras un rato sin uso y tardan ~30s en
  despertar en la primera visita. Es normal.
- **Base de datos free**: la de Render caduca a los ~90 dias. Para algo permanente,
  crea una base gratis en https://neon.tech y reemplaza `DATABASE_URL` del backend
  por la de Neon (no hay que cambiar codigo).
- **Actualizaciones**: cada vez que hagas `git push` a `main`, Render redespliega
  automaticamente.
