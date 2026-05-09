import express from "express"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"
import accountRouter from "./routes/account.routes.js"
// import transactionRouter

const app = express()

app.use(express.json())
app.use(cookieParser())

app.get("/", (req, res) => {
    res.send("Banking API is up and running")
})

app.use('/api/auth', authRouter)
app.use('/api/accounts', accountRouter)
// app.use('/api/transactions', transactionRouter)

export default app
