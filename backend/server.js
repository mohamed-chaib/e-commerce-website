import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js"
import couponRoutes from "./routes/coupon.route.js"
import paymentRoutes from "./routes/payment.route.js"
import analyticsRoute from "./routes/analytics.route.js"

//import lemonApi from "./lib/lemon.js";

import cookieParser from "cookie-parser";
import {connectDB} from "./lib/db.js";

dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json()) // allows you to parse the body of the request 
app.use(cookieParser())
// routes 
app.use("/api/auth",authRoutes)
app.use("/api/products",productRoutes)
app.use("/api/cart",cartRoutes)
app.use("/api/coupons",couponRoutes)
app.use("/api/payments",paymentRoutes)
app.use("/api/analytics",analyticsRoute)


app.listen(PORT,()=>{
    console.log(`server is runing port : http://localhost:${PORT}`)
}) 