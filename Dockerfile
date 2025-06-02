FROM mongo:8

WORKDIR /app

ENV NODE_ENV=production
ENV TZ="Asia/Jerusalem"
ENV HOST=0.0.0.0

RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_current.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g pm2

RUN mkdir -p storage

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install

COPY ./scripts/ /app/scripts/
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

CMD ["npm", "run", "dockerProduction"]