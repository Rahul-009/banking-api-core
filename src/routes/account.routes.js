import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import accountController from "../controllers/account.controller.js"

const router = express.Router()

/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)


/**
 * - GET /api/accounts/
 * - Get all accounts of the logged-in user
 * - Protected Route
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)


/**
 * - GET /api/accounts/balance/:accountId
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)



export default router