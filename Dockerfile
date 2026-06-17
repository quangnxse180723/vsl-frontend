
# # ==========================================
# # Stage 1: Build the application
# # ==========================================
# FROM node:22-alpine AS builder

# # Set the working directory inside the container
# WORKDIR /app

# # Copy package files first to leverage Docker layer caching
# COPY package.json package-lock.json ./

# # Install ALL dependencies (including devDependencies required for Vite/esbuild)
# RUN npm ci

# # Copy the rest of your source code
# COPY . .

# # Run your build script (vite build && esbuild ...)
# RUN npm run build

# # ==========================================
# # Stage 2: Production environment
# # ==========================================
# FROM node:22-alpine AS runner

# WORKDIR /app

# # Set environment to production
# ENV NODE_ENV=production

# # Copy package files again for production dependencies
# COPY package.json package-lock.json ./

# # Install ONLY production dependencies. 
# # This is crucial because your esbuild script uses `--packages=external`, 
# # meaning libraries like Express and @google/genai aren't bundled into server.cjs.
# RUN npm ci --omit=dev

# # Copy the built 'dist' directory from the builder stage
# COPY --from=builder /app/dist ./dist

# # Expose port 3000 as you requested
# EXPOSE 3000

# # Set environment variable for your server to pick up the port (if applicable)
# ENV PORT=3000

# # Start the Node Express server
# CMD ["npm", "start"]

# Stage 1: Build React + Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package trước để tận dụng cache
# (nếu package.json không đổi, Docker không cần npm install lại)
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build ra thư mục /app/dist
RUN npm run build

# ─────────────────────────────────────────
# Stage 2: Serve bằng Nginx (image nhẹ ~25MB)
# ─────────────────────────────────────────
FROM nginx:alpine

# Copy file đã build vào thư mục Nginx serve
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy cấu hình Nginx tùy chỉnh
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
