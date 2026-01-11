const jwt = require("jsonwebtoken");

exports.verifyToken = async (req, res, next) => {
  try {
    if (!req.cookies.token) throw new Error("missing a cookie token");
    const token = String(req.cookies.token).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) throw new Error("invalid token");
    req.user = payload;
    next();
  } catch (error) {
    console.log(error.message);
    return res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};
