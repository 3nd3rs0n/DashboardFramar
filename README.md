# Enterprise Audit Dashboard

Sistema web empresarial para gestión de información, auditoría, procesos, hallazgos, no conformidades, riesgos, oportunidades, acciones, tareas, actividades e indicadores KPI.

## Stack

- **Frontend** (`web/`): React + TypeScript + Vite + shadcn/ui + React Router + TanStack Query + React Hook Form + Zod + Recharts
- **Backend** (`server/`): Node.js + Fastify + TypeScript + Zod + JWT + Swagger/OpenAPI
- **BD**: PostgreSQL + Prisma ORM

## Requisitos

- Node.js 20+
- PostgreSQL 14+ corriendo localmente

## Puesta en marcha

```bash
# 1. Base de datos
createdb audit_dashboard   # o crearla desde psql/pgAdmin

# 2. Backend
cd server
cp .env.example .env       # ajustar DATABASE_URL y JWT_SECRET
npm install
npx prisma migrate deploy  # aplica la migración inicial
npm run seed               # usuario admin + datos demo
npm run dev                # http://localhost:3001  (docs: /docs)

# 3. Frontend (otra terminal)
cd web
npm install
npm run dev                # http://localhost:5173
```

## Credenciales demo

- `admin@example.com` / `Admin123!` (ADMIN)
- `framar@framar.cl` / `MiClaveSegura123!` (VIEWER)

## Estructura

```
server/
  prisma/            schema, migraciones, seed
  src/
    modules/         un módulo por recurso (routes + schemas + service)
    plugins/         prisma, auth (JWT)
    lib/             auditoría, paginación
web/
  src/
    api/             client, tipos, hooks (TanStack Query)
    components/      layout, tabla, formularios, estados
    pages/           una página por módulo
```

## Modelo de datos

```
Department → Process → Procedure
Process → Finding / NonConformity / Risk / Opportunity / Task / Activity / KPI
Finding / NonConformity / Risk / Opportunity → Action → Task
KPI → KPIValue
```

Toda mutación queda registrada en `AuditLog` (trazabilidad).

## API

Documentación interactiva (Swagger UI): `http://localhost:3001/docs`.
Autenticación: `Authorization: Bearer <token>` (login en `POST /api/auth/login`).
