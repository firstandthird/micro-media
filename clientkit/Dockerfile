FROM firstandthird/clientkit:2.0.3

RUN apk add --update git

RUN cd /ck && npm install eslint-config-firstandthird eslint-plugin-import

COPY package.json /app/package.json
RUN npm install
