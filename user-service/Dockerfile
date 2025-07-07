FROM node:18
WORKDIR /app
COPY user-service/package*.json ./
RUN npm install
COPY user-service/ ./
COPY shared/ ./shared/
EXPOSE 5000
CMD ["npm", "start"] 