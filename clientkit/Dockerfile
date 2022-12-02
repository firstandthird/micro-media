FROM firstandthird/clientkit:3.9.0

RUN cd /ck && \
  rm package.json && \
  rm package-lock.json && \
  npm install --no-save eslint-config-firstandthird eslint-plugin-import

COPY package.json /app/package.json
RUN npm install
