const jwt = require("jsonwebtoken");

exports.verifyToken = async (req, res, next) => {
  try {
    if (!req.cookies.token && !req.headers.authorization) throw new Error("missing a cookie/Bearer token");
    const token = req.cookies.token || String(req.headers.authorization).split(" ")[1]
    const payload = jwt.verify(token.trim(), process.env.JWT_SECRET);
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
