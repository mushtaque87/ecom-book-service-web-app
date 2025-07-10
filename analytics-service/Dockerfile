FROM node:18
WORKDIR /app
COPY analytics-service/package*.json ./
RUN npm install
COPY analytics-service/ ./
COPY shared/ ./shared/
EXPOSE 5000
CMD ["npm", "start"] 