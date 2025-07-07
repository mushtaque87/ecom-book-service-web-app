FROM node:18
WORKDIR /app
COPY publisher-service/package*.json ./
RUN npm install
COPY publisher-service/ ./
COPY shared/ ./shared/
EXPOSE 5000
CMD ["npm", "start"] 