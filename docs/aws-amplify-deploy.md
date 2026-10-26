# Despliegue en AWS Amplify

Esta guía documenta cómo poner Intimate (Next.js 15, App Router) a correr en AWS Amplify Hosting, y las decisiones de infraestructura ya tomadas que condicionan la configuración. No repite el producto; ver `intimate.md` para eso.

## 1. Qué soporta Amplify aquí

Amplify Hosting con **compute SSR** (no export estático) soporta Next.js 12–15, incluyendo App Router, Server Actions y Route Handlers. El build spec del repo (`amplify.yml`, en la raíz) usa pnpm porque el proyecto está fijado a `pnpm-lock.yaml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - corepack enable
        - corepack prepare pnpm@11.13.1 --activate
        - pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - .next/cache/**/*
      - node_modules/**/*
```

Amplify detecta `.next` como salida SSR automáticamente y despliega el compute necesario (no hace falta configurar Lambda a mano para el renderizado).

## 2. Alta de la app en Amplify

1. Conectar el repo de GitHub (cuenta del usuario, no un fork).
2. Elegir la rama de producción. Por decisión de alcance, **solo hay dos entornos: local y producción**, sin previews por rama/PR. Deshabilitar "Enable pull request previews" al crear la app.
3. Confirmar que Amplify detecta `amplify.yml` de la raíz (no usar el asistente visual de build settings, para que el build spec quede versionado en el repo).
4. **Región:** elegir la misma región donde vive el proyecto de NeonDB. Si Neon todavía no tiene región fijada, fijarla primero — es un pendiente bloqueante (ver memoria `intimate-mvp-decisions`). Cada consulta entre regiones distintas añade latencia de red en cada request SSR.

## 3. Variables de entorno y secretos

Amplify tiene dos mecanismos; usar el correcto según sensibilidad:

- **Variables de entorno de Amplify** (App settings → Environment variables): valores no sensibles — `NODE_ENV`, flags de feature, URLs públicas.
- **AWS Secrets Manager**, referenciado desde Amplify: la cadena de conexión de Neon y cualquier credencial. Nunca poner `DATABASE_URL` como variable de entorno plana de Amplify — por la decisión de infra, Neon es un endpoint público sin forma de restringir por IP de salida de Amplify, así que la única mitigación disponible es que el secreto no quede en texto plano en ninguna consola ni log de build.

Variables mínimas esperadas (completar cuando se cierren los pendientes de email/push):

| Variable | Origen | Nota |
|---|---|---|
| `DATABASE_URL` | Secrets Manager | Rol de Postgres de mínimo privilegio, sin permisos DDL |
| `DATABASE_MIGRATE_URL` | Secrets Manager, solo en CI | Rol separado con permisos de migración; no se usa en runtime |
| `BETTER_AUTH_SECRET` | Secrets Manager | |
| `S3_BUCKET` / credenciales | Variable de entorno + IAM role de Amplify | Preferir el IAM role del compute de Amplify sobre access keys cuando Amplify lo permita en la región elegida |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Secrets Manager | |
| Email (SendGrid o SES) | Pendiente de elegir | Bloqueado por el dominio (sección 5) |

## 4. Base de datos: Neon desde Amplify

- **Driver obligatorio:** `drizzle-orm/neon-serverless` (usa WebSocket vía el paquete `ws`). El driver `neon-http` no sirve: lanza `No transactions support in neon-http driver`, y el producto necesita transacciones (confirmación de acuerdos por ambos miembros, cálculo de rachas de pareja).
- Las migraciones corren desde CI (GitHub Actions u otro runner fuera del build de Amplify) con un rol de Postgres distinto al de runtime, que sí tiene permisos de DDL. El build de Amplify no debe correr migraciones.
- Mismo requisito de región que la sección 2: Amplify y el proyecto de Neon en la misma región de AWS.

## 5. Dominio y email (bloqueante)

El dominio no es un pendiente cosmético: sin dominio propio autenticado (DKIM/SPF) no hay email confiable, y el login por enlace mágico depende de email. Antes de poder decir "Intimate está desplegado" de forma usable:

1. Registrar el dominio (pendiente: el usuario aún no decide el nombre final, ver memoria del producto).
2. Configurarlo en Amplify (Domain management) para el front.
3. Verificar el dominio para envío de correo en el proveedor elegido (SES o SendGrid). Si es SES, pedir salida de modo sandbox con anticipación — Amazon tarda en aprobar el acceso de producción.

Hasta que esto esté resuelto, el despliegue puede funcionar para pruebas internas pero no para onboarding real de parejas (sin email no hay invitación de pareja ni login).

## 6. Qué no lleva CDK

CDK se reserva para lo que Amplify Hosting no cubre: KMS (si se necesita cifrado por campo con llave propia en vez de la gestión nativa), WAF delante de Amplify, y el Lambda de recordatorios (cron) — Amplify Hosting no tiene scheduler propio; eso vive en Amplify Functions o en una Lambda con EventBridge aparte. No usar Aurora, RDS Data API, ni CDK para la base de datos: eso fue reemplazado por NeonDB.

## 7. Checklist antes de promover a producción

- [ ] Región de Amplify = región del proyecto de Neon.
- [ ] `DATABASE_URL` solo en Secrets Manager, rol sin DDL.
- [ ] Rol de migración separado, usado solo desde CI.
- [ ] Previews de PR deshabilitados; solo rama de producción conectada.
- [ ] Dominio verificado y DKIM/SPF activos antes de habilitar registro real de usuarios.
- [ ] Driver de Neon confirmado como `neon-serverless` en el código de conexión (no `neon-http`).
