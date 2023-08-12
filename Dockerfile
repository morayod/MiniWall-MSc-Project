FROM node:14

WORKDIR /miniwall

COPY . .

RUN npm install

EXPOSE 5000

CMD ["npm", "start"]