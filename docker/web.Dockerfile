FROM node:20-alpine AS base
WORKDIR /app
COPY package.json tsconfig.base.json tsconfig.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/types/package.json packages/types/package.json
RUN npm install
COPY . .
RUN npm run build -w @horse-timer/web
CMD ["npm", "run", "start", "-w", "@horse-timer/web"]

