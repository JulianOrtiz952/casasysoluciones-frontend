El frontend de Casas y Soluciones sirve para consultar inmuebles en arriendo y administrar la operación inmobiliaria desde una interfaz web.<br>
Permite a administradores, asistentes, arrendatarios y técnicos gestionar propiedades, inventarios y reportes de daños según su rol.

# Casas y Soluciones — Frontend

Aplicación desarrollada con Next.js que incluye un catálogo público y un panel privado. Se conecta con la API del [repositorio del backend](https://github.com/JulianOrtiz952/casasysoluciones-backend).

## Funcionalidades

- Catálogo público con fotografías, descripción y precio de los inmuebles.
- Acceso por roles: administrador, asistente administrativo, arrendatario y técnico.
- Gestión de inmuebles, usuarios y propiedades asociadas.
- Creación y seguimiento de tickets de daños.
- Inventarios con observaciones, firma digital y descarga en PDF.
- Indicadores de operación y exportación de tickets en CSV.
- Importación y exportación de inmuebles y usuarios mediante Excel.
- Tema claro y oscuro.

## Tecnologías

- Next.js 16 y React 19.
- TypeScript y Tailwind CSS 4.
- Axios y Fetch para comunicación con la API.
- JWT para autenticación con el backend.

## Estructura

```text
casasysoluciones-frontend/
├── src/app/
│   ├── page.tsx          # Catálogo público
│   ├── inmuebles/        # Detalle público de inmuebles
│   ├── login/            # Inicio de sesión
│   ├── dashboard/        # Panel privado y módulos de gestión
│   ├── components/       # Componentes compartidos
│   └── globals.css       # Estilos globales
├── public/               # Recursos públicos
├── next.config.ts
└── package.json
```

## Requisitos

- Node.js 20.9 o superior y npm, según el requisito de Next.js incluido en el proyecto.
- Git para clonar el repositorio.
- El backend configurado y en ejecución.

## Instalación y ejecución local

Si ya clonaste el repositorio, comienza desde su carpeta y omite `git clone` y `cd`.

En PowerShell, desde la carpeta donde guardarás el proyecto:

```powershell
git clone https://github.com/JulianOrtiz952/casasysoluciones-frontend.git
cd casasysoluciones-frontend
npm ci
if (!(Test-Path .env.local)) { Copy-Item .env.local.example .env.local }
npm run dev
```

Si ya existe `.env.local`, revisa su contenido antes de copiar la plantilla. La variable para conectar con el backend local debe ser:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Usa `.env.local.example` para desarrollo: la plantilla `.env.example` del frontend apunta a la API de producción.

Abre [http://localhost:3000](http://localhost:3000) para consultar el catálogo o [http://localhost:3000/login](http://localhost:3000/login) para ingresar con la cuenta creada.

Para crear la cuenta administradora, sigue las instrucciones de `createsuperuser` en el [README del backend](https://github.com/JulianOrtiz952/casasysoluciones-backend#readme).

## Conexión con el backend

Durante el desarrollo, el frontend utiliza el puerto 3000 y el backend el puerto 8000. En el entorno de Django configura:

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

Si cambias el dominio o el puerto del frontend, actualiza esos orígenes. Reinicia el servidor de desarrollo después de modificar `.env.local`.

Configura `NEXT_PUBLIC_API_URL` con la URL base del backend, sin agregar `/api/v1`, ya que las llamadas de la aplicación añaden sus rutas.

Con el backend en ejecución, puedes consultar su [documentación Swagger](http://localhost:8000/api/v1/schema/swagger/).

## Comandos disponibles

```powershell
npm run dev    # Iniciar el servidor de desarrollo
npm run lint   # Revisar el código con ESLint
npm run build  # Generar la compilación de producción
npm start      # Servir una compilación existente
```

## Despliegue

Configura `NEXT_PUBLIC_API_URL` con la URL del backend de producción antes de compilar. Después ejecuta:

```powershell
npm ci
npm run build
npm start
```

Si cambias `NEXT_PUBLIC_API_URL`, vuelve a generar la compilación. Configura los orígenes permitidos en el backend para el dominio donde publiques esta aplicación.

## Proyecto relacionado

El [backend de Casas y Soluciones](https://github.com/JulianOrtiz952/casasysoluciones-backend) contiene los modelos, las reglas de negocio, la autenticación y la API que utiliza esta interfaz.
