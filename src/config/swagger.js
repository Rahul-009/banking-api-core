import swaggerJsdoc from 'swagger-jsdoc';
import { schemas } from './swagger.schemas.js';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Banking API',
      version: '1.0.0',
      description:
        'Banking API Core — accounts, account types, transactions (double-entry ledger), and auth. ' +
        'Most endpoints require a Bearer access token obtained via /auth/login. ' +
        'Use the Authorize button below to set it once for all "Try it out" requests.',
      contact: { email: 'rahuldn5864@gmail.com' },
    },
    servers: [{ url: 'http://localhost:3000/api', description: 'Local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token (15 min expiry). Obtain via POST /auth/login or POST /auth/refresh.',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description:
            'httpOnly refresh token cookie (7 day expiry), set by POST /auth/login, ' +
            'read by POST /auth/refresh and POST /auth/logout.',
        },
      },
      schemas,
    },
  },
  // Resolved relative to process.cwd() (where `node server.js` runs from),
  // not relative to this file.
  apis: ['./src/routes/*.routes.js'],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
