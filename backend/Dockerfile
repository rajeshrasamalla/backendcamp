FROM node:20-alpine

# Install nodemon globally for hot reload in dev
RUN npm install -g nodemon

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
