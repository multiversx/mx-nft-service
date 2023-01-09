FROM node:lts As build
RUN apt update
RUN apt install build-essential
RUN curl -fsSL https://deb.nodesource.com/setup_14.x |  bash -
RUN  apt-get install -y nodejs
RUN  apt-get install -y npm
RUN useradd -m multiversx

FROM build as development
WORKDIR /usr/src/app

COPY package*.json ./

RUN chown -R multiversx /usr/src/app

RUN npm install
COPY . .
EXPOSE 3005

CMD ["npm", "run", "start:dev"]
