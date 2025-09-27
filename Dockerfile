# Stage 1: Build con Node.js
FROM node:20-alpine as builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm i

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Stage 2: Servir con nginx
FROM nginx

# Crear directorio de trabajo
RUN mkdir -p /usr/share/nginx/html
WORKDIR /usr/share/nginx/html

# Instalar herramientas necesarias
RUN apt-get update -y && \
    apt-get install unzip nano -y && \
    apt-get clean

# Copiar los archivos de la aplicación construida
# COPY /dist /usr/share/nginx/html
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar la configuración de nginx
COPY /src/cert/default.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

CMD ["nginx","-g","daemon off;"]