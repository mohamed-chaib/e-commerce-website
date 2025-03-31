import express from 'express'
import { protectRoute } from '../middleware/auth.middleware.js';
import { getCoupon , validateCoupon} from '../controller/coupon.controller.js';

const router = express.Router()

export default router;
router.get("/",protectRoute,getCoupon)
router.get("/validate",protectRoute,validateCoupon)