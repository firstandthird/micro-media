FROM firstandthird/clientkit:2.0.3 as clientkit

RUN apk add --update git

RUN cd /ck && npm install eslint-config-firstandthird eslint-plugin-import

COPY clientkit/package.json /app/package.json
RUN npm install

COPY clientkit /app/clientkit
COPY views /app/assets

ENV NODE_ENV production
RUN clientkit prod

FROM mhart/alpine-node:6.7

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

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app
RUN npm install --silent --production

COPY . /app

COPY --from=clientkit /app/dist $HOME/src/public/_dist

ENV NODE_ENV production

CMD ["npm", "start"]

