---
name: enterprise-audit-dashboard
description: Skill principal para desarrollar el sistema empresarial de gestión, auditoría, procesos, hallazgos, tareas, riesgos, oportunidades y KPI.
---

# Enterprise Audit Dashboard

## 1. Propósito del proyecto

Este proyecto consiste en desarrollar una aplicación web empresarial para registrar, organizar, analizar y visualizar información relacionada con la gestión de procesos, auditoría interna, oportunidades de mejora, riesgos, hallazgos, tareas, procedimientos e indicadores KPI.

El sistema debe permitir transformar información operativa y de auditoría en información estructurada para facilitar la toma de decisiones.

El sistema será utilizado principalmente por un analista encargado de levantar información de diferentes departamentos, documentar procesos, detectar oportunidades de mejora y realizar seguimiento.

---

# 2. Contexto empresarial

La aplicación está orientada a la gestión de información de una organización con múltiples departamentos.

Los principales departamentos considerados inicialmente son:

- Recursos Humanos
- Finanzas
- Operaciones
- Mantenimiento
- Prevención de Riesgos
- Tecnología / IT
- Administración

La arquitectura debe permitir agregar nuevos departamentos sin modificar la estructura principal del sistema.

---

# 3. Objetivos principales

El sistema debe permitir:

1. Registrar información empresarial.
2. Registrar departamentos.
3. Registrar procesos.
4. Registrar procedimientos.
5. Registrar hallazgos.
6. Registrar no conformidades.
7. Registrar riesgos.
8. Registrar oportunidades de mejora.
9. Registrar acciones correctivas.
10. Registrar tareas.
11. Registrar actividades diarias.
12. Registrar indicadores KPI.
13. Visualizar información mediante dashboards.
14. Generar reportes.
15. Realizar seguimiento de compromisos.
16. Mantener trazabilidad de cambios.
17. Gestionar usuarios y permisos.

---

# 4. Stack tecnológico

## Frontend

Utilizar:

- React
- TypeScript
- Vite
- shadcn/ui
- React Router
- TanStack Query
- React Hook Form
- Zod
- Recharts

## Backend

Utilizar:

- Node.js
- Fastify
- TypeScript
- Zod
- JWT
- Swagger/OpenAPI

## Base de datos

Utilizar:

- PostgreSQL
- Prisma ORM

## Desarrollo

Utilizar:

- Git
- GitHub
- VS Code
- WARP
- OpenCode

---

# 5. Principios de arquitectura

La aplicación debe mantener separación clara entre:

- Presentación
- Lógica de negocio
- Acceso a datos
- Base de datos

Evitar mezclar lógica de negocio directamente dentro de componentes React.

Evitar realizar consultas a PostgreSQL directamente desde el frontend.

El frontend debe comunicarse exclusivamente con la API.

La API debe validar los datos antes de enviarlos a la capa de negocio.

Prisma será utilizado como ORM para acceder a PostgreSQL.

---

# 6. Flujo general

La arquitectura lógica debe seguir:

Frontend
    ↓
TanStack Query
    ↓
API REST
    ↓
Fastify
    ↓
Zod
    ↓
Services
    ↓
Repositories / Prisma
    ↓
PostgreSQL

---

# 7. Reglas de TypeScript

Utilizar TypeScript estrictamente.

Evitar:

- any
- código duplicado
- tipos implícitos cuando puedan provocar errores
- funciones excesivamente grandes

Preferir:

- interfaces
- types
- enums cuando correspondan
- tipos reutilizables
- funciones pequeñas
- componentes reutilizables

No utilizar `any` salvo que exista una justificación técnica documentada.

---

# 8. Reglas del frontend

Los componentes deben ser reutilizables.

Utilizar shadcn/ui como base visual.

No crear componentes visuales duplicados.

Utilizar React Hook Form para formularios complejos.

Utilizar Zod para validación.

Utilizar TanStack Query para comunicación con la API.

Utilizar React Router para navegación.

Los componentes deben manejar:

- loading
- error
- empty state
- success state

Los formularios deben mostrar mensajes de validación claros para el usuario.

---

# 9. Diseño visual

La aplicación debe tener apariencia empresarial.

Priorizar:

- claridad
- simplicidad
- consistencia
- accesibilidad
- responsive design
- jerarquía visual

Evitar interfaces excesivamente decorativas.

El usuario debe poder encontrar rápidamente:

- indicadores
- tareas pendientes
- hallazgos
- riesgos
- oportunidades
- actividades
- información crítica

---

# 10. Dashboard principal

El dashboard principal debe mostrar información ejecutiva.

Debe contemplar inicialmente:

### Indicadores generales

- Total de hallazgos
- Hallazgos abiertos
- Hallazgos vencidos
- Tareas pendientes
- Tareas completadas
- Procedimientos documentados
- Riesgos activos
- Oportunidades de mejora

### Indicadores por departamento

Permitir filtrar por:

- Recursos Humanos
- Finanzas
- Operaciones
- Mantenimiento
- Prevención de Riesgos
- IT

### Gráficos

Utilizar Recharts.

Considerar:

- gráficos de barras
- gráficos de líneas
- gráficos circulares
- gráficos de tendencias
- comparaciones entre departamentos

---

# 11. Módulo de hallazgos

Un hallazgo debe permitir registrar como mínimo:

- ID
- título
- descripción
- departamento
- proceso
- fecha
- tipo
- prioridad
- impacto
- causa
- riesgo asociado
- acción propuesta
- responsable
- fecha compromiso
- estado
- evidencia
- fecha de cierre

Estados iniciales:

- ABIERTO
- EN_ANALISIS
- ACCION_DEFINIDA
- EN_EJECUCION
- PENDIENTE_VERIFICACION
- CERRADO
- REABIERTO

---

# 12. Módulo de tareas

Una tarea debe permitir:

- título
- descripción
- departamento
- responsable
- prioridad
- fecha de creación
- fecha límite
- estado
- porcentaje de avance
- evidencia
- observaciones

Estados:

- PENDIENTE
- EN_PROGRESO
- BLOQUEADA
- COMPLETADA
- CANCELADA

---

# 13. Módulo de actividades

Debe permitir registrar actividades realizadas durante la jornada.

Cada actividad debe considerar:

- fecha
- descripción
- departamento
- proceso
- tipo de actividad
- responsable
- tiempo utilizado
- resultado
- observaciones
- evidencia

Ejemplos:

- reunión
- levantamiento de información
- creación de procedimiento
- revisión documental
- análisis de hallazgo
- seguimiento
- auditoría
- capacitación

---

# 14. Módulo de procedimientos

Debe permitir registrar:

- nombre
- código
- departamento
- proceso
- objetivo
- alcance
- responsables
- definiciones
- referencias normativas
- descripción del proceso
- riesgos
- oportunidades
- documentos relacionados
- versión
- estado
- fecha de revisión

Estados:

- BORRADOR
- EN_REVISION
- APROBADO
- OBSOLETO

---

# 15. Módulo de riesgos

Un riesgo debe considerar:

- descripción
- departamento
- proceso
- causa
- consecuencia
- probabilidad
- impacto
- nivel de riesgo
- controles existentes
- acciones
- responsable
- fecha de revisión
- estado

---

# 16. Módulo de oportunidades

Registrar:

- descripción
- origen
- departamento
- proceso
- beneficio esperado
- acción propuesta
- responsable
- prioridad
- fecha objetivo
- estado

---

# 17. Módulo KPI

Cada KPI debe tener:

- nombre
- código
- descripción
- departamento
- proceso
- fórmula
- unidad de medida
- meta
- frecuencia
- responsable
- fuente de datos
- valor actual
- período
- estado

Los KPI deben permitir comparar:

- valor actual
- meta
- período anterior
- tendencia

---

# 18. ISO 9001

El sistema debe facilitar la gestión relacionada con:

- enfoque a procesos
- riesgos
- oportunidades
- información documentada
- seguimiento
- medición
- evaluación del desempeño
- mejora continua
- no conformidades
- acciones correctivas

No afirmar que una funcionalidad garantiza automáticamente el cumplimiento de ISO 9001.

El sistema solamente debe facilitar la gestión y trazabilidad de la información relacionada.

---

# 19. Usuarios y permisos

El sistema debe permitir diferentes roles.

Roles iniciales:

- ADMIN
- ANALISTA
- JEFE_DEPARTAMENTO
- USUARIO

Los permisos deben controlar acciones como:

- visualizar
- crear
- editar
- eliminar
- aprobar
- cerrar
- verificar
- exportar

---

# 20. Seguridad

Utilizar JWT para autenticación.

Las contraseñas nunca deben almacenarse en texto plano.

Las rutas protegidas deben validar autenticación.

Las operaciones sensibles deben validar autorización.

No exponer secretos en el frontend.

Utilizar variables de entorno.

---

# 21. API

La API debe ser REST.

Utilizar:

- GET
- POST
- PUT/PATCH
- DELETE

Validar entradas utilizando Zod.

Documentar endpoints mediante Swagger/OpenAPI.

Los errores deben utilizar respuestas HTTP apropiadas.

---

# 22. Base de datos

Utilizar PostgreSQL mediante Prisma ORM.

Las relaciones deben estar correctamente normalizadas.

Evitar duplicación innecesaria de información.

Utilizar:

- primary keys
- foreign keys
- índices
- timestamps

Las entidades importantes deben registrar:

- createdAt
- updatedAt

Cuando sea necesario, utilizar:

- deletedAt

para eliminación lógica.

---

# 23. Auditoría y trazabilidad

Las acciones importantes deben poder rastrearse.

Considerar una futura tabla de auditoría:

- usuario
- acción
- entidad
- registro afectado
- fecha
- datos anteriores
- datos nuevos

---

# 24. Reglas de desarrollo

Antes de implementar una funcionalidad:

1. Comprender el requerimiento.
2. Revisar arquitectura existente.
3. Revisar modelos relacionados.
4. Identificar impacto.
5. Proponer solución.
6. Implementar.
7. Ejecutar validaciones.
8. Ejecutar tests.
9. Revisar TypeScript.
10. Documentar cambios importantes.

No modificar grandes partes del proyecto sin explicar previamente el motivo.

---

# 25. Reglas para base de datos

Antes de crear una tabla:

1. Identificar entidad.
2. Identificar relaciones.
3. Identificar cardinalidad.
4. Identificar campos obligatorios.
5. Identificar índices.
6. Identificar restricciones.

No crear tablas duplicadas para información conceptualmente equivalente.

---

# 26. Reglas para componentes

Preferir:

- componentes pequeños
- componentes reutilizables
- composición
- props tipadas
- hooks reutilizables

Evitar componentes monolíticos de cientos de líneas.

---

# 27. Reglas para formularios

Todos los formularios importantes deben:

1. Utilizar React Hook Form.
2. Utilizar Zod.
3. Mostrar errores.
4. Mostrar estado de envío.
5. Evitar doble envío.
6. Mostrar confirmación cuando corresponda.
7. Invalidar/refrescar los datos de TanStack Query después de operaciones exitosas.

---

# 28. Reglas para dashboards

Los gráficos deben responder preguntas de negocio.

No agregar gráficos solamente por estética.

Cada gráfico debe tener:

- título
- contexto
- unidad
- período
- filtros cuando corresponda

Preferir información accionable.

---

# 29. Reglas para KPI

Nunca crear un KPI sin definir:

- qué mide
- por qué se mide
- cómo se calcula
- cuál es su meta
- cuál es su frecuencia
- quién es responsable

Ejemplo:

KPI:
Porcentaje de acciones correctivas cerradas.

Fórmula:

acciones cerradas / acciones totales * 100

---

# 30. Reglas para el agente

Antes de escribir código:

- revisar archivos existentes
- reutilizar componentes
- reutilizar servicios
- evitar duplicación
- respetar arquitectura
- respetar las Skills activas

Cuando exista una decisión arquitectónica importante, explicar brevemente la razón.

No eliminar código existente sin justificarlo.

No instalar dependencias innecesarias.

No cambiar el stack tecnológico sin autorización.

---

# 31. Criterio de finalización

Una funcionalidad solamente debe considerarse terminada cuando:

- funciona
- TypeScript no presenta errores
- las validaciones funcionan
- los estados loading/error/empty están considerados
- la API está validada
- los tests relevantes pasan
- la interfaz es usable
- la implementación respeta la arquitectura existente

---

# 32. Migraciones de Prisma

Los cambios estructurales de base de datos deben realizarse mediante migraciones de Prisma.

No modificar manualmente la base de datos de producción como mecanismo normal de evolución.

Antes de una migración importante:

- revisar el impacto
- comprobar relaciones
- comprobar datos existentes
- comprobar restricciones

---

# 33. Git

Utilizar Git para controlar cambios.

Antes de realizar cambios importantes:

1. revisar `git status`
2. entender el estado actual
3. evitar sobrescribir trabajo existente

Los commits deben describir claramente los cambios.

Ejemplos:

```text
feat: agregar módulo de hallazgos
fix: corregir validación de tareas
refactor: separar servicio de indicadores
docs: actualizar documentación de API
```