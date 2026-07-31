# Conexión inicial de SSC-Admin

El flujo implementado es:

`Front → Cloudflare Worker → Google Apps Script → Google Sheets`

## 1. Crear la base de datos

1. Crea un Google Sheet vacío y copia su ID.
2. Vincula o copia los archivos de `Backend` a un proyecto de Apps Script.
3. En **Configuración del proyecto → Propiedades de la secuencia de comandos**, crea:
   - `SSC_SHEET_ID`: ID del Sheet.
   - `BRIDGE_SECRET`: cadena aleatoria larga, compartida únicamente con Cloudflare.
   - `OTP_PEPPER`: otra cadena aleatoria larga y diferente.
4. Ejecuta `setupDatabase()` una vez y concede los permisos solicitados.
5. Ejecuta `upsertInitialUser("correo@dominio.com", "Nombre", "admin")`.

Se crearán cuatro hojas:

- `Usuarios`: personas autorizadas y roles.
- `CodigosAcceso`: códigos temporales protegidos mediante hash.
- `Sesiones`: sesiones activas, almacenadas también mediante hash.
- `Auditoria`: eventos de acceso.

## 2. Publicar Apps Script

Implementa el proyecto como **Aplicación web**:

- Ejecutar como: **Yo**
- Quién tiene acceso: **Cualquier usuario**

Copia la URL terminada en `/exec`. Las solicitudes útiles siguen protegidas por
`BRIDGE_SECRET`; el navegador nunca recibe ese secreto.

## 3. Publicar el puente de Cloudflare

Dentro de `Cloudflare`, configura:

```text
npx wrangler secret put APPS_SCRIPT_URL
npx wrangler secret put BRIDGE_SECRET
npx wrangler deploy
```

`BRIDGE_SECRET` debe ser exactamente igual al configurado en Apps Script.
Actualiza `ALLOWED_ORIGINS` en `wrangler.toml` con el origen real donde se publica
el Front y vuelve a desplegar.

## 4. Conectar el Front

Reemplaza `API_URL` en `Front/app.js` por la URL pública del Worker. No coloques
la URL de Apps Script ni secretos en el Front.

Para desarrollo local, sirve `Front` desde `http://localhost:5500`; abrir
`index.html` directamente como archivo no produce un origen permitido.

## 5. Prueba mínima

1. Abre el Front desde un origen autorizado.
2. Escribe el correo registrado con `upsertInitialUser`.
3. Confirma la recepción del código.
4. Introduce los seis números.
5. Comprueba que `CodigosAcceso`, `Sesiones` y `Auditoria` tengan registros nuevos.
