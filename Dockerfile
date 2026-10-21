FROM node:24.22.1 As build
RUN apt update
RUN apt install build-essential
RUN useradd -m multiversx

FROM build as development
WORKDIR /usr/src/app

COPY package*.json ./

RUN chown -R multiversx /usr/src/app

RUN npm install
COPY . .
EXPOSE 3005

CMD ["npm", "run", "start:dev"]
