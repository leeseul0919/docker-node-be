# 의존성 설치
FROM node:16-buster
WORKDIR /app
COPY package*.json ./ 
RUN npm ci --only=production

# "ws" 모듈을 설치합니다.
RUN npm install ws
RUN npm install -s mongodb
RUN npm install mongoose

ENV NODE_ENV production

COPY . .

# node 이미지에 이미 "node"라는 사용자가 uid/gid 1000번으로 생성되어 있음
USER node

EXPOSE 3000
CMD ["npm", "start"]
