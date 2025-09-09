# Node.js 런타임 버전을 명시합니다. LTS 버전을 권장합니다.
FROM node:20-alpine

# 앱 디렉토리 생성
WORKDIR /usr/src/app

# package.json과 package-lock.json을 복사합니다.
# npm ci는 package-lock.json을 사용하므로 더 빠르고 안정적인 빌드를 보장합니다.
COPY package*.json ./
RUN npm ci --only=production

# 앱 소스 코드를 복사합니다.
COPY . .

# 앱이 사용하는 포트를 명시합니다.
EXPOSE 3001

# 컨테이너가 시작될 때 실행할 명령어를 정의합니다.
CMD [ "node", "index.js" ]
