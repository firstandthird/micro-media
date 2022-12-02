FROM firstandthird/clientkit:3.9.0 as clientkit

COPY clientkit/package.json /app/package.json
RUN npm install

ENV NODE_ENV production

COPY clientkit /app/clientkit
COPY views /app/assets

RUN clientkit prod

FROM node:18.12.1-alpine

ENV HOME=/home/app
ENV PATH=/home/app/src/node_modules/.bin:$PATH
ENV NODE_ENV production

EXPOSE 8080

WORKDIR $HOME/src

COPY --from=clientkit /app/dist /home/app/src/public/_dist

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
  python3 \
  vips \
  nasm

COPY package.json $HOME/src/
RUN npm install --legacy-deps

COPY . $HOME/src

CMD ["rapptor"]
