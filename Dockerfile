
FROM node:24-alpine3.23

# ARG USERNAME=dev
# ARG USER_UID=1000


RUN apk update && apk add git 

# RUN adduser -u $USER_UID $USERNAME -D

# ARG PRIVATE_KEY  

WORKDIR /usr/src/app

COPY . .

RUN npm install -g npm@latest @nestjs/cli \
    && npm install
   

EXPOSE 3000

# EXPOSE 9229

USER node

CMD [ "npm", "run", "start:dev" ]