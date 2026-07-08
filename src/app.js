import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger.js';

import authRouter from './routes/auth.routes.js';
import profileRouter from './routes/profile.routes.js';
import accountRouter from './routes/account.routes.js';
import transactionRouter from './routes/transaction.routes.js';
import accountTypeRouter from './routes/accountType.routes.js';

import { globalLimiter } from './middleware/rateLimit.middleware.js';
import AppError from './utils/appError.utils.js';

const app = express();

// Comma-separated list, e.g. CORS_ORIGINS=http://localhost:5173,https://myapp.com
// Falls back to FRONTEND_URL (already used for password reset links) for
// the common single-origin case.
const corsOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.FRONTEND_URL ||
  'http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(globalLimiter);
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Banking API is up and running');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/account', accountRouter);
app.use('/api/transaction', transactionRouter);
app.use('/api/account-type', accountTypeRouter);

// Interactive API docs. Left public (no auth gate) — this is a portfolio
// demo project and the point is a reviewer being able to open the link
// and try it. Overwrites (not merges with) the global helmet() CSP for
// this path only, since swagger-ui-express's bundled UI needs inline
// scripts/styles that the default CSP blocks.
app.use(
  '/api-docs',
  (req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    );
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Banking API Docs' })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler (one place for ALL errors). Express requires 4
// params to recognize this as error-handling middleware, even though
// `next` itself is unused here.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err instanceof AppError) {
    // 4xx messages are intentionally descriptive ("Account not found") and
    // safe to show clients. 5xx messages often wrap a raw driver/internal
    // error (see e.g. account.controller.js's next(new AppError(error.message, 500)))
    // and should be generic outside development.
    const exposeMessage = err.statusCode < 500 || process.env.NODE_ENV === 'development';
    return res.status(err.statusCode).json({
      success: false,
      message: exposeMessage ? err.message : 'Internal server error',
      errors: err.errors,
    });
  }

  // MongoDB errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
