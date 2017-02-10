FROM firstandthird/node:6.7

RUN apk add --update libpng-dev \
      autoconf \
      automake \
      make \
      g++ \
      libtool \
      nasm
