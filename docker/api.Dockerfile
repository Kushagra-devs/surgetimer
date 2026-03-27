FROM node:20-alpine AS base
WORKDIR /app
COPY package.json tsconfig.base.json tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/timer-engine/package.json packages/timer-engine/package.json
COPY packages/hardware-adapters/package.json packages/hardware-adapters/package.json
RUN npm install
COPY . .
RUN npm run build -w @horse-timer/api
CMD ["npm", "run", "start", "-w", "@horse-timer/api"]

