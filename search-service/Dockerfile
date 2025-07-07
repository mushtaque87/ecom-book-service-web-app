FROM node:18
WORKDIR /app
COPY search-service/package*.json ./
RUN npm install
COPY search-service/ ./
COPY shared/ ./shared/
EXPOSE 5000
CMD ["npm", "start"] 