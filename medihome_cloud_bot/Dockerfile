FROM node:20-alpine

# Instalar dependencias necesarias para compilar paquetes nativos si se requieren
RUN apk add --no-cache git python3 make g++

WORKDIR /app

# Copiar manifiesto de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --omit=dev

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Variable de entorno por defecto
ENV PORT=3000

# Iniciar servidor
CMD ["node", "server.js"]
