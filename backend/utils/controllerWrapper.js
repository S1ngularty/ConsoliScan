function controllerWrapper(fn) {
  return async function (req, res) {
    try {
      const result = await fn(req, res);
      return res.status(200).json({
        success: true,
        result,
      });
    } catch (error) {
      console.log(error.message,error.line,error);
      return res.status(500).json(error);
    }
  };
}

module.exports = controllerWrapper;
