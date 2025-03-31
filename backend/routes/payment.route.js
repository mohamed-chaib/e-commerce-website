import express from 'express'
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createCheckoutSession } from "../controller/payment.controller.js";


const router = express.Router();

router.post('/create-checkout-session',protectRoute,createCheckoutSession)

export default router;