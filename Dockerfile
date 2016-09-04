FROM mhart/alpine-node:4.5

RUN apk add --update git

RUN npm i -g nodemon

ADD . /app/
WORKDIR /app/

RUN npm rebuild

CMD [ "npm", "start" ]
