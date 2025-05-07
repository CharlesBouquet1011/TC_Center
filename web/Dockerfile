FROM node:23-alpine3.20 AS tc-node

WORKDIR /app
COPY ./backend/ ./

#PROD
#ARG USER_ID
#RUN adduser -S -u ${USER_ID} appuser

RUN npm install
EXPOSE 80

#PROD
#USER appuser
#CMD ["npm","start"]

#DEV
CMD ["npm","run","dev"]



FROM node:23-alpine3.20 AS tc-react

WORKDIR /app
COPY ./frontend/ ./

#PROD
#ARG USER_ID
#RUN adduser -S -u ${USER_ID} appuser

EXPOSE 80

#PROD
#RUN chown -R appuser /app && chmod -R 755 /app
#USER appuser

RUN npm install

#PROD   
#RUN npm run build
#CMD ["npx", "serve", "build", "-p", "80"]

#DEV
CMD ["npm", "start"]