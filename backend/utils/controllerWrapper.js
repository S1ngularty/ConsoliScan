function controllerWrapper(fn) {
  return async function (req, res) {
    try {
      // console.log(`=== Controller ${fn.name} called ===`);
      // console.log("req.query:", req.query);
      // console.log("req.params:", req.params);
      // console.log("req.body:", req.body);
      // console.log("req.user:", req.user);

      const result = await fn(req, res);

      // console.log(`=== Controller ${fn.name} result ===`);
      // console.log("Result type:", typeof result);
      // console.log(
      //   "Result keys:",
      //   result ? Object.keys(result).slice(0, 5) : "null",
      // );

      return res.status(200).json({
        success: true,
        result,
      });
    } catch (error) {
      if(error.code === 11000) return res.status(201)
      console.error(`=== Controller ${fn.name} ERROR ===`);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.log(error.message, error.line, error);
      return res.status(500).json(error);
    }
  };
}

module.exports = controllerWrapper;
