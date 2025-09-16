import mongoose from "mongoose";    
import Product from "./product.model.js";

const orderSchema = new mongoose.Schema({
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
        required : true
    },
    products:[{
         product :{
            type:mongoose.Schema.Types.ObjectId,
            ref :'Product',
            required : true
        },
        quantity :{
            type : Number,
            requird : true,
            min : 1
        },
        price :{
            type : Number,
            required :true ,
            min :0,
        }
    }],
    totalAmount :{
         type : Number,
         required : true,
         min:0
    },
    StripeSessionId:{ 
        type : String,
        unique :true
    }
},{
    timestamps : true
})

const  Order = mongoose.model("Order",orderSchema);
export default Order;