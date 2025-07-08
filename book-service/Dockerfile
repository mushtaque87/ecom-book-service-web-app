FROM node:18
RUN echo "Book Service"
WORKDIR /app
COPY book-service/package*.json ./
RUN npm install
COPY book-service/ ./
COPY shared/ ./shared/
EXPOSE 5000
CMD ["npm", "start"] 