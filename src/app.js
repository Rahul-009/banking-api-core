import express from "express"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"
import profileRouter from "./routes/profile.routes.js"
import accountRouter from "./routes/account.routes.js"
import transactionRouter from "./routes/transaction.routes.js"

import { globalLimiter } from "./middleware/rateLimit.middleware.js"

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
app.use('/api/accounts', accountRouter)
app.use('/api/transactions', transactionRouter)

export default app
