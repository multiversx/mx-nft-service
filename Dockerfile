FROM node:24.22.3 AS build
RUN apt update
RUN apt install build-essential
RUN useradd -m multiversx

FROM build AS development
WORKDIR /usr/src/app

COPY package*.json ./

RUN chown -R multiversx /usr/src/app

RUN npm install
COPY . .
EXPOSE 3005

CMD ["npm", "run", "start:dev"]
