FROM node:18
WORKDIR /app
COPY analytics-service/package*.json ./
RUN npm install
COPY . .
EXPOSE 5010
CMD ["npm", "start"] 