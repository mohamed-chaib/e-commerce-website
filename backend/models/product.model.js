import mongoose  from "mongoose";

const productSchema = mongoose.Schema({
    name  : {
        type : String,
        required : [true, "product name is required "]
    },
    description : {
        type : String,
        min : 0,
        required : true
    }
    ,
    price: {
        type: Number,
        required : [true  , " Price is required"]
    },
    image:{
        type :String,
        required : [true , " Image is required"]
    },
    category:{
        type : String,
        required : true
    },
    isFeatured:{
        type : Boolean,
        default : false
    }
},{
    timeStamps: true
});

const Product = mongoose.model("Product",productSchema);
export default Product;