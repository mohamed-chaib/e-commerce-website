import Product from "../models/product.model.js";

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    const existtingItem = user.cartItems.find(
      (item) => productId == item.productId
    );
    if (existtingItem) {
      existtingItem.quantity += 1;
    } else {
      user.cartItems.push(productId);
    }
    await user.save();
    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log("error in addToCart  controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;
    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
    }
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("error in removeAllFromCart  controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.body;
    const { quantity } = req.body;
    const user = req.user;
    const existtingItem = user.cartItems.find((item) => item.id === productId);
    if (existtingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter((item) => item.id !== productId);
        await user.save();
        return res.json(user.cartItems);
      }

      existtingItem.quantity = quantity;
      await user.save();
      return res.json(user.cartItems);
    } else {
      return res.satus(404).json({ message: "Product NOT Found" });
    }
  } catch (error) {
    console.log("error in updateQuantity  controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getCartProducts = async (req, res) => {
  try {
    const user  = req.user;
      const products = await Product.find({_id :{ $in : user.cartItems}});
      if (products) {
        // add quantity for each product 
        const cartItems = user.cartItems(product =>{
           const item = user.cartItems.find(cartItem => cartItem.id=== product.id)
           return {...product.toJSON(), quantity : item.quantity}
        })

              return res.status(200).json(cartItems);

      }

  } catch (error) {
    console.log("error in getCartProducts  controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};