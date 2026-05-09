import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Elsawah Travel API',
    version: '1.0.0',
    description: 'API documentation for the Transport Booking System',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server',
    },
  ],
  paths: {
    '/api/v1/auth/login': {
      post: {
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Successful login' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/bookings': {
      post: {
        summary: 'Create a new booking',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  studentName: { type: 'string' },
                  studentPhone: { type: 'string' },
                  pickupLocation: { type: 'string' },
                  dropoffLocation: { type: 'string' },
                  tripId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Booking confirmed' },
          400: { description: 'Trip Full / Validation Error' },
        },
      },
      get: {
        summary: 'Get all bookings (Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of bookings' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
