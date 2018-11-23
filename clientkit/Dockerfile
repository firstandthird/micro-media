FROM firstandthird/clientkit:3.8.2

RUN apk add --update git

RUN cd /ck && npm install eslint-config-firstandthird eslint-plugin-import

COPY package.json /app/package.json
RUN npm install
