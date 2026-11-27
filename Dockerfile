# 웹 이미지 (Next.js). push하면 Dokploy가 이 파일로 다시 빌드한다.
# NEXT_PUBLIC_API_URL 은 빌드할 때 코드에 박히므로 빌드 인자로 준다 (예: https://ai.gsw226.xyz/api).
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_TELEMETRY_DISABLED=1
# 미리 그려 두는 화면(데모 채팅의 메시지 시각)을 브라우저와 같은 한국 시간으로 만든다. UTC로 두면 서버 "오전 12:12" / 브라우저 "오전 9:12"로 어긋난다
# ponytail: 한국 시간 고정. 다른 시간대 사용자가 생기면 시각을 브라우저에서만 그리게 바꿀 것
ENV TZ=Asia/Seoul
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
