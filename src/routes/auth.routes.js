import express from "express"
import authController from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/register", authController.userRegisterController)
router.post("/login",authController.userLoginController)
router.post("/logout", authController.userLogoutController)

export default router