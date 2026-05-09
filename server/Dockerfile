# FROM node:20-alpine AS base
# WORKDIR /app
# COPY package.json ./

# FROM base AS dev
# RUN npm install
# COPY . .
# CMD ["npm", "run", "start:dev"]

# FROM base AS prod
# RUN npm install --legacy-peer-deps --omit=dev
# COPY . .
# CMD ["npm", "run", "start"]


FROM node:20-alpine

# install python
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .

CMD ["npm", "run", "start"]