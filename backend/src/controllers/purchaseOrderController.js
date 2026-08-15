const purchaseOrderService = require("../services/purchaseOrderService");

exports.createPurchaseOrder = async (req, res) => {
  try {
    const poData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const po = await purchaseOrderService.createPurchaseOrder(poData);

    res.status(201).json({
      message: "Purchase order created successfully",
      purchaseOrder: po,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create purchase order",
      error: error.message,
    });
  }
};

exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const result = await purchaseOrderService.getAllPurchaseOrders(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch purchase orders",
      error: error.message,
    });
  }
};

exports.getPurchaseOrderById = async (req, res) => {
  try {
    const po = await purchaseOrderService.getPurchaseOrderById(req.params.id);

    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.status(200).json(po);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch purchase order",
      error: error.message,
    });
  }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const po = await purchaseOrderService.updatePurchaseOrder(
      req.params.id,
      req.body,
    );

    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.status(200).json({
      message: "Purchase order updated successfully",
      purchaseOrder: po,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update purchase order",
      error: error.message,
    });
  }
};

exports.receivePurchaseOrder = async (req, res) => {
  try {
    const { receivedItems } = req.body;
    const result = await purchaseOrderService.receivePurchaseOrder(
      req.params.id,
      receivedItems,
      req.user.id,
    );

    res.status(200).json({
      message: "Purchase order received successfully",
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to receive purchase order",
      error: error.message,
    });
  }
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    await purchaseOrderService.deletePurchaseOrder(req.params.id);
    res.status(200).json({ message: "Purchase order deleted successfully" });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete purchase order",
      error: error.message,
    });
  }
};

exports.getPurchaseOrderAnalytics = async (req, res) => {
  try {
    const { timeRange = 30 } = req.query;
    const analytics = await purchaseOrderService.getPurchaseOrderAnalytics(
      parseInt(timeRange),
    );

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get purchase order analytics",
      error: error.message,
    });
  }
};
