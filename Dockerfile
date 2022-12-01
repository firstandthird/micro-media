FROM firstandthird/clientkit:3.8.2 as clientkit

COPY clientkit/package.json /app/package.json
RUN npm install

ENV NODE_ENV production

COPY clientkit /app/clientkit
COPY views /app/assets

RUN clientkit prod

FROM node:18.12.0-alpine

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

COPY package.json package-lock.* $HOME/src/
RUN NODE_ENV=production npm ci

COPY . $HOME/src

COPY --from=clientkit /app/dist /home/app/src/public/_dist

EXPOSE 8080
ENV PORT 8080

CMD ["rapptor"]
