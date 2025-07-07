FROM node:18
WORKDIR /app
COPY order-service/package*.json ./
RUN npm install
COPY order-service/ ./
COPY shared/ ./shared/
EXPOSE 5000
CMD ["npm", "start"] 