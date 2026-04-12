import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export function setupErrorHandler(server: FastifyInstance) {
  server.setErrorHandler(function (error, request: FastifyRequest, reply: FastifyReply) {
    server.log.error(error);

    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        issues: error.issues,
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      });
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });
}
