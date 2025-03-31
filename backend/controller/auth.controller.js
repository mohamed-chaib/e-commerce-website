import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};
const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  ); // 7 days
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, //  prevents XSS attacks
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // prevents CSRF attacks
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, //  prevents XSS attacks
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExist = await User.findOne({ email });
    if (userExist) {
        return res.status(400).json({message : "User already exist"});
    }

    const user = await User.create({ name, email, password });

    //authenticate
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      User: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User create succesfuly",
    });
  } catch (error) {
    console.log("error in signup controller" + error.message);
    res.status(500).json({ message: error.message });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password, user.password))) {
      {
        const { accessToken, refreshToken } = generateTokens(user._id);

        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);
        res.status(200).json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          message: "Login successful ",
        });
      }
    }
    else{
            return res.status(401).json({ message: "email or password incorrect " });
    }
  } catch (error) {
    console.log("error in login controller : " + error.message);
    return res.status(500).json({ message: error.message });
  }
};
/**
 * @description Logout user by invalidating refresh token and clearing cookies
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await redis.del(`refresh_token:${decoded.userId}`);
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");
      res.status(200).json({ message: "Logout successful" });
    }
    else{
        res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    console.log("error in signup controller : " + error.message);

    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            return res.status(401).json({message : "Unauthorized"})
        }
        const decoded =  jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
        

        if (refreshToken!==storedToken) {
            return res.status(401).json({message : "Invalid refresh token "})
        }
        const accessToken = jwt.sign({userId : decoded.userId},process.env.ACCESS_TOKEN_SECRET,{expiresIn : "15m"});
        res.cookie("accessToken",accessToken,{
            httpOnly : true,
            secure : process.env.NODE_ENV==="production",
            samesite : "strict",
            maxAge: 15*60*1000
        })
        res.status(200).json({message : "Refresh token successful "})
    } catch (error) {
      console.log("error in refresh token controller : " + error.message);
  
      res.status(500).json({ message: "server error" ,error: error.message });
    }
  };

  // TO DO :  implement get profile later
// export const getProfile = async (req, res) => {}
