# 웹 이미지 (Next.js). push하면 Dokploy가 이 파일로 다시 빌드한다.
# NEXT_PUBLIC_API_URL 은 빌드할 때 코드에 박히므로 빌드 인자로 준다 (예: https://ai.gsw226.xyz/api).
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
