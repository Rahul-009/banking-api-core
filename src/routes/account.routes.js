import express from "express"

import accountController from "../controllers/account.controller.js"

import authMiddleware from "../middleware/auth.middleware.js"
import { requireCompleteProfile } from "../middleware/profileCompletion.middleware.js"
import validation from '../middleware/validations/account.validation.js'
import { validateRequest } from "../middleware/validateRequest.middleware.js"

const router = express.Router()

router.use(authMiddleware.authMiddleware)
router.use(requireCompleteProfile)

router.post("/",  validation.createAccountValidation, validateRequest, accountController.createAccount)
router.get("/",  validation.listAccountsValidation, validateRequest, accountController.getAccounts)
router.get("/:id",  validation.accountIdValidation, validateRequest, accountController.getAccountById)
router.get("/number/:accountNumber",  validation.accountNumberValidation, validateRequest, accountController.getAccountByNumber)
router.get("/:id/balance", validation.balanceValidation, validateRequest, accountController.getAccountBalance)

router.patch("/:id", validation.updateAccountValidation, validateRequest, accountController.updateAccount)
router.patch("/:id/freeze", validation.freezeAccountValidation, validateRequest, accountController.freezeAccount)
router.patch("/:id/close", validation.accountIdValidation, validateRequest, accountController.closeAccount)
router.patch("/:id/activate", validation.accountIdValidation, validateRequest, accountController.activateAccount)


export default router