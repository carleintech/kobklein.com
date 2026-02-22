FROM node:20-alpine

WORKDIR /app

# Copy package manifests and install all deps
COPY package.json ./
RUN npm install

# Copy everything else
COPY . .

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/src/main"]
