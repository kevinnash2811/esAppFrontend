# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).


### Opción 1: Ejecutar TODO el servicio, esto creara automaticamente la imagen y lo levantara en un contenedor
```bash
docker-compose up -d --build --force-recreate

Luego en el navegador podras ingresar a : http://localhost:3001/banking

### Opción 2: Ejecutar TODO el servicio
En caso que se necesite solo ejecutar la aplicacion desde local sigue los pasos:
1. Instala las dependencias
npm i

2. ejecuta el siguiente comando para ejecutar:
npm run dev

Luego en el navegador podras ingresar a : http://localhost:3001/banking
