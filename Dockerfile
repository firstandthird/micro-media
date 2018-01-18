FROM firstandthird/clientkit:2.0.3 as clientkit

RUN apk add --update git

RUN cd /ck && npm install eslint-config-firstandthird eslint-plugin-import

COPY clientkit/package.json /app/package.json
RUN npm install

COPY clientkit /app/clientkit
COPY views /app/assets

ENV NODE_ENV production
RUN clientkit prod

FROM firstandthird/node:8.8-onbuild

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

COPY --from=clientkit /app/dist /home/app/src/public/_dist
