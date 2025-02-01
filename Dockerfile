# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript project
RUN npm run build

#prisma Generate
RUN npx prisma generate

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]

