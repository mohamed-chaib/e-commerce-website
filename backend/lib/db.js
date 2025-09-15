import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()
export const connectDB = async ()=>{
    try {
       const conn =  await mongoose.connect(process.env.MONGO_URI)
            console.log(`connect at : ${conn.connection.host} `)
        
    } catch (error) {
        console.log(`error to connect mongo : ${error.message} `)
        process.exit(1)

        
    }
}