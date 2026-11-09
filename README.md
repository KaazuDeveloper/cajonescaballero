# Cajones Caballero

Tienda para personalizar cajones flamencos. Proyecto de fin de grado, actualizado.

- `front/`: Angular 22
- `back/`: Node, Express y MongoDB

## Probarla sin configurar nada

```bash
npm install
npm run install:all
npm run demo
```

Abre http://localhost:4200. La demo usa una base de datos temporal y simula el correo y los pagos;
nunca se conecta a los servicios reales. Los códigos de verificación salen por la consola.

Usuarios: `admin@demo.test` y `cliente@demo.test`, contraseña `Demo12345`.

## Con los servicios reales

Copia `back/.env.example` a `back/.env`, rellénalo y ejecuta `npm run dev`.

## Pruebas

```bash
npm test
```

## Publicar

El front se genera con `npm --prefix front run build` en `front/dist/tfgpage/browser`.
