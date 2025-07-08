FROM node:18
RUN echo "Publisher Service"
WORKDIR /app
COPY publisher-service/package*.json ./
RUN npm install
COPY publisher-service/ ./
COPY shared/ ./shared/
EXPOSE 5000
CMD ["npm", "start"] 