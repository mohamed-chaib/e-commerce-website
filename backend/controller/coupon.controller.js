import { disconnect } from "mongoose";
import Coupon from "../models/coupon.model.js";

export const getCoupon = async function (req, res) {
  try {
    const coupons = await Coupon.find({
      userId: req.user._id,
      isActivate: true,
    });

    if (coupons) {
      return res.status(200).json(coupons);
    }
    return res.json({ message: "There IS No Coupons" });
  } catch (error) {
    console.log("error in getCoupon controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const validateCoupon = async function (req, res) {
    try {
        const {couponCode} = req.body;
        const coupon = await  Coupon.findOne({code : couponCode , userId : req.user._id,isActivate : true})

        if (!coupon) {
           return res.status(404).json({message : "Coupon Not Found"})  
        }
        if (coupon.expirationDate < new Date()) {
            coupon.isActivate = false;
            await coupon.save();
            res.status(404).json({message : "coupon  expired"})
        }
        res.json({
            message : "Coupon is Valid",
            code : coupon.code,
            discounetPercentage : coupon.discountPercentage
        })
        
    } catch (error) {
        console.log("error in validateCoupon controller" + error.message);
         res.status(500).json({ message: error.message });
      
    }
  };