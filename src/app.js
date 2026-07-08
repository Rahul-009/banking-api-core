import express from "express"
import cookieParser from "cookie-parser"

import authRouter from "./routes/auth.routes.js"
import profileRouter from "./routes/profile.routes.js"
import accountRouter from "./routes/account.routes.js"
import transactionRouter from "./routes/transaction.routes.js"
import accountTypeRouter from './routes/accountType.routes.js'

import { globalLimiter } from "./middleware/rateLimit.middleware.js"
import AppError from "./utils/appError.utils.js"

const app = express()

app.use(globalLimiter)
app.use(express.json())
app.use(cookieParser())

app.get("/", (req, res) => {
    res.send("Banking API is up and running")
})

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRouter)
app.use('/api/profile', profileRouter)
app.use('/api/account', accountRouter)
app.use('/api/transaction', transactionRouter)
app.use('/api/account-type', accountTypeRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler (one place for ALL errors)
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }

  // MongoDB errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry'
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app
