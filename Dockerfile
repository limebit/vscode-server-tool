# base node image
FROM node:16-bullseye-slim as base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

# Install all node_modules, including dev dependencies
FROM base as deps

RUN mkdir /app
WORKDIR /app

ADD package.json yarn.lock ./
RUN yarn install --production=false

# Setup production node_modules
FROM base as production-deps

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
ADD package.json yarn.lock ./
RUN yarn install --production --ignore-scripts

# Build the app
FROM base as build

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD prisma .
ADD . .
RUN yarn run prisma:generate
RUN yarn run build

# Finally, build the production image with minimal footprint
FROM base

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

# Add RUN true because of COPY bugs in multistage builds
COPY --from=production-deps /app/node_modules /app/node_modules
RUN true
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
RUN true
COPY --from=build /app/build /app/build
RUN true
COPY --from=build /app/public /app/public
ADD . .

ADD start_with_seed.sh /

RUN chmod +x /start_with_seed.sh

EXPOSE 80

CMD ["/start_with_seed.sh"]
