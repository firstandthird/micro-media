FROM firstandthird/clientkit:2.0.3 as clientkit

RUN cd /ck && npm install eslint-config-firstandthird eslint-plugin-import

COPY clientkit/package.json /app/package.json
RUN npm install

COPY clientkit /app/clientkit
COPY views /app/assets

RUN clientkit prod

FROM node:8-alpine

ENV HOME=/home/app
ENV PATH=/home/app/node_modules/.bin:$PATH
WORKDIR $HOME/src

COPY --from=clientkit /app/dist $HOME/public/_dist

COPY package.json $HOME/package.json

RUN apk add --update \
     git \
     make \
     gcc \
     libpng-dev \
     autoconf \
     automake \
     make \
     g++ \
     libtool \
     nasm

RUN npm install --production

COPY . $HOME/

EXPOSE 8080

CMD ["npm", "start"]
