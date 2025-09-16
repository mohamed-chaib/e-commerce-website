import Coupon from "../models/coupon.model.js";
import dotenv from "dotenv"
import {stripe} from "../lib/stripe.js"
import Order from '../models/order.model.js'
dotenv.config()

export const createCheckoutSession = async (req,res)=>{
  try {
    const {products,couponCode} = req.body
    if (!Array.isArray(products || products.length ===condition0)) {
      res.status(400).json({error:"Inavalid or Empty Products Array"})
    }
    let totalAmount =0
    let lineItems  = products.map((product)=>{
      const amount = Math.round(product.price*100) // stripe want u to send in the fomat of cents
      totalAmount += amount * product.quantity

      return {
        price_data:{
          currency : "usd",
          product_data :{
            name : product.name,
            images : [product.name]
          },
          unit_amount : amount
        }
      }
    });
    let coupon = null 
    if (couponCode) {
      coupon = await Coupon.findOne({code:couponCode,userId : req.user._id, isActive:true})
      if (coupon) {
       totalAmount-= Math.round(totalAmount * coupon.discountPercentage /100)
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types :['card'],
      mode:'payment',
      line_items: lineItems,
      success_url : `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url : `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts : coupon
      ?[{
        coupon : await createStripeCoupon(coupon.discountPercentage),
      },
    ]:[] ,
    metadata:{
      userId : req.user._id,
      couponCode : couponCode || "",
      products : JSON.stringify(products.map((p)=>({
        id:p._id,
        qauntit: p.quantity,
        price:p.price

      }))) 

    }

    })

    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id)
    }
    res.status(200).json({id:session.id , totalAmount : totalAmount /100})
  
  } catch (error) {
      console.log("error in createCheckoutSession  controller" + error.message);
    res.status(500).json({ message: error.message });
    
  }
}
export const checkoutSuccess = async (req,res)=>{
    try {
        const sessionId = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId) ;
        if (session.payment_status === 'paid') {
            if (session.metadata.couponCode) {
                await Coupon.findOneAndUpdate({
                    code : session.metadata.couponCode,
                    userId : session.metadata.userId    
                },
            {
                isActive :false 
            })
            }
            // create new order
            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user:session.metadata.userId,
                products : products.map((product)=>({
                    product: product.id,
                    quantity : product.quantity,
                    price : product.price
                })),
                totalAmount : session.amount_total / 100, // convert fom cents to dollat
                StripeSessionId : sessionId 
            })
            await newOrder.save(),
            res.status(200).json( {
                success: true,
                message: "Payment Succesful, order created , and coupon deactivated if used",
                orderId: newOrder._id 
            })
        }
    } catch (error) { 
        console.log("error inCheckoutSuccess  controller" + error.message);
    res.status(500).json({ message: error.message });
    }
}
async function createStripeCoupon(discountPercentage) {
  try {
    const coupon  = await stripe.coupons.create({
      percent_off :discountPercentage,
      duration :"once"
    })
    return coupon.id
  } catch (error) {
    throw error
  }
}
async function createNewCoupon(userID) {
  try {
    const newCoupon  = new Coupon({
      code : "GIF T"+ Math.random().toString(36).substring(2,8).toUpperCase(),
      discountPercentage:10,
      expirationDate:new Date(Date.now() + 30*24*60*60*1000) , // 30 days forn now
      userId : userID
    })
    await newCoupon.save();
    return newCoupon;
  } catch (error) {
    throw error
  }
}