FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start:prod:migrate"]
