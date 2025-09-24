# Use official Node.js image as a base
FROM node:20-slim

# Set timezone to prevent signature issues
ENV TZ=UTC
RUN apt-get update && apt-get install -y tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching dependencies)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN NEXT_DISABLE_ESLINT=1 npm run build

# Expose port 3020
EXPOSE 3020

# Start the Next.js application
CMD ["npm", "run", "start", "--", "-p", "3020"]
