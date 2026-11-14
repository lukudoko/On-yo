FROM node:26-alpine
WORKDIR /app

# Prisma needs openssl on alpine
RUN apk add --no-cache openssl

COPY package*.json ./
# copy the schema before install so postinstall prisma generate can find it
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
