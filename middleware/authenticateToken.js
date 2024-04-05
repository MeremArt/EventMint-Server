const jwt = require("jsonwebtoken");
const { Mint } = require("../model/schema");

const authenticateToken = async (req, res, next) => {
  try {
    // Get token from request headers, cookies, or query parameters
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.cookies.token ||
      req.query.token;

    if (!token) {
      console.warn("No token provided");
      return next(); // Proceed to the next middleware or route handler
    }

    // Verify token and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    if (decoded.exp < now) {
      // Token is expired, refresh token
      const user = await Mint.findById(decoded.userId);
      if (!user) {
        throw new Error("User not found");
      }
      const newToken = user.createJWT();
      res.cookie("token", newToken, { httpOnly: true, secure: true });

      // Update decoded with new token's payload
      decoded.exp = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes from now
    }

    // Attach user object to request for further middleware or route handler access
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error in authentication middleware:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = authenticateToken;
