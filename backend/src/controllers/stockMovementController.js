const stockMovementService = require("../services/stockMovementService");

exports.getStockMovements = async (req, res) => {
  try {
    const result = await stockMovementService.getStockMovements(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stock movements",
      error: error.message,
    });
  }
};

exports.getProductStockHistory = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const history = await stockMovementService.getProductStockHistory(
      req.params.productId,
      parseInt(days),
    );

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stock history",
      error: error.message,
    });
  }
};

exports.getStockAnalytics = async (req, res) => {
  try {
    const { timeRange = 30 } = req.query;
    const analytics = await stockMovementService.getStockAnalytics(
      parseInt(timeRange),
    );

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get stock analytics",
      error: error.message,
    });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, reason } = req.body;

    const result = await stockMovementService.adjustStock(
      productId,
      quantity,
      reason,
      req.user.id,
    );

    res.status(200).json({
      message: "Stock adjusted successfully",
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to adjust stock",
      error: error.message,
    });
  }
};
