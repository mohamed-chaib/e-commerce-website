import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
 import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); // find all products
    res.status(200).json({ products });
  } catch (error) {
    console.log("error in getAllProduct  controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedData = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.status(200).json(JSON.parse(featuredProducts));
    }
    // if not in redis , fetch it from mongoo db
    // .lean() is gonna return a javascript object instead of mongoose object
    // which is  good for performance
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      return res.status(400).json({ message: "No featured product found " });
    }
    // else , store it in redis for future quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    return res.status(200).json({ featuredProducts });
  } catch (error) {
    console.log("error in get Featured Data controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, image, price, category } = req.body;
    let cloudinaryresponse = null;
    if (image) {
      cloudinaryresponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }
    const product = Product.create({
      name,
      description,
      image: cloudinaryresponse?.secure_url || "",
      category,
      price,
    });
    return res.status(201).json({ message: "Created Succesfuly!", product });
  } catch (error) {
    console.log("error in createPost controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = Product.findByI(req.params.id);
    let cloudinaryresponse = null;
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("image deleted");
      } catch (error) {
        console.log("error in deleting image" + error.message);
      }
    }
    await Product.findByIdAndDelete(req.params.id);
    return res.status(201).json({ message: "Deleted Succesfuly!" });
  } catch (error) {
    console.log("error in deleteproduct controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
        $project: { _id: 1, name: 1, description: 1, image: 1, price: 1 },
      },
    ]);

    res.status(200).json({ products });
  } catch (error) {
    console.log("error in getRecomendedProduct controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ category });
    if (products) {
      return res.status(200).json({ products });
    }
    return res.status(400).json({ message: "Product not found" });
  } catch (error) {
    console.log("error in getProductsByCategory controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findByI(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProductsCache();
      return res.status(200).json({ updatedProduct });
    }
    return res.status(400).json({ message: "Product not found" });
  } catch (error) {
    console.log("error in toggleFeaturedProduct controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};

async function updateFeaturedProductsCache() {
  try {
    const products = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products",JSON.stringify(products));
  } catch (error) {
    console.log(
      "error in updateFeaturedProductsCache function" + error.message
    );
    res.status(500).json({ message: error.message });
  }
}
