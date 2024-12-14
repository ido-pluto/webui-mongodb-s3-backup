FROM mongo:8

WORKDIR /app

ENV NODE_ENV=production
ENV TZ="Asia/Jerusalem"
ENV HOST=0.0.0.0

RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_current.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g pm2

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install

COPY ./src/ /app/src/
COPY ./public/ /app/public/
COPY ./astro.config.mjs /app/
COPY ./tailwind.config.mjs /app/
COPY ./tsconfig.json /app/
COPY ./pm2.config.json /app/

RUN npx astro telemetry disable
RUN npm run build

EXPOSE 4321

ENV WEBSITE_PASSWORD=""
ENV WEBSITE_SECRET=""
ENV MONGO_INITDB_ROOT_USERNAME=root
ENV MONGO_INITDB_ROOT_PASSWORD=example

CMD ["pm2-runtime", "start", "/app/pm2.config.json"]