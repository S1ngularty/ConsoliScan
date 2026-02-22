const jwt = require("jsonwebtoken");

exports.verifyToken = async (req, res, next) => {
  try {
    if (!req.cookies.token && !req.headers.authorization)
      throw new Error("missing a cookie/Bearer token");
    const token =
      req.cookies.token || String(req.headers.authorization).split(" ")[1];
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

/**
 * Role-Based Access Control Middleware
 * Usage: roleAccess('admin') or roleAccess(['admin', 'manager'])
 * @param {string|string[]} allowedRoles - Single role or array of roles
 * @returns {function} Middleware function
 */
exports.roleAccess = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated (verifyToken should be called first)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated. Please provide a valid token.",
        });
      }
      console.log(`User role: ${req.user.role}, Allowed roles: ${allowedRoles}`);
      // Convert single role to array for uniform processing
      const rolesArray = Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles];

      // Check if user's role is in allowed roles
      if (!rolesArray.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required role(s): ${rolesArray.join(", ")}. Your role: ${req.user.role}`,
        });
      }

      next();
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        success: false,
        error: "Error checking user role",
      });
    }
  };
};

/**
 * Multiple Permissions Middleware
 * Check if user has ALL specified permissions
 * Usage: checkPermissions(['create:product', 'edit:product'])
 * @param {string[]} requiredPermissions - Array of required permissions
 * @returns {function} Middleware function
 */
exports.checkPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated.",
        });
      }

      // If user has admin role, allow all permissions
      if (req.user.role === "admin") {
        return next();
      }

      // Check if user has all required permissions
      const userPermissions = req.user.permissions || [];
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required permissions: ${requiredPermissions.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        success: false,
        error: "Error checking user permissions",
      });
    }
  };
};

/**
 * User Ownership Middleware
 * Check if the requested resource belongs to the user or user is admin
 * Usage: checkOwnership('userId') where userId is extracted from req.params or req.query
 * @param {string} paramName - The parameter name containing the user ID
 * @returns {function} Middleware function
 */
exports.checkOwnership = (paramName = "userId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated.",
        });
      }

      // Allow access if user is admin
      if (req.user.role === "admin") {
        return next();
      }

      // Get the resource owner ID from params or body
      const resourceOwnerId = req.params[paramName] || req.body[paramName];

      if (!resourceOwnerId) {
        return res.status(400).json({
          success: false,
          error: `Missing ${paramName} parameter`,
        });
      }

      // Check if user owns the resource
      if (
        req.user.userId !== resourceOwnerId &&
        req.user._id !== resourceOwnerId
      ) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only access your own resources.",
        });
      }

      next();
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        success: false,
        error: "Error checking resource ownership",
      });
    }
  };
};
