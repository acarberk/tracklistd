import 'reflect-metadata';

import fastifyCookie from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { EnvService } from './config/env.service';

const SWAGGER_PATH = 'api/docs';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  await app.register(fastifyCookie);

  const envService = app.get(EnvService);

  if (!envService.isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Tracklistd API')
      .setDescription('Unified media tracking platform')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(SWAGGER_PATH, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = envService.port;
  await app.listen({ port, host: '0.0.0.0' });

  const url = await app.getUrl();
  const logger = app.get(Logger);
  logger.log(`API listening on ${url}`);
  if (!envService.isProduction) {
    logger.log(`Swagger docs at ${url}/${SWAGGER_PATH}`);
  }
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to bootstrap API', error);
  process.exit(1);
});
