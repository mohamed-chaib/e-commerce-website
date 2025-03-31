import Stripe from "stripe";
import dotev from 'dotenv'
dotev.config();
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
