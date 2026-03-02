const supplierService = require("../services/supplierService");

exports.createSupplier = async (req, res) => {
  try {
    const supplierData = {
      ...req.body,
      addedBy: req.user.id,
    };

    const supplier = await supplierService.createSupplier(supplierData);

    res.status(201).json({
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create supplier",
      error: error.message,
    });
  }
};

exports.getAllSuppliers = async (req, res) => {
  try {
    const result = await supplierService.getAllSuppliers(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch suppliers",
      error: error.message,
    });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const result = await supplierService.getSupplierById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch supplier",
      error: error.message,
    });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await supplierService.updateSupplier(
      req.params.id,
      req.body,
    );

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.status(200).json({
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update supplier",
      error: error.message,
    });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    await supplierService.deleteSupplier(req.params.id);
    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete supplier",
      error: error.message,
    });
  }
};

exports.getSupplierAnalytics = async (req, res) => {
  try {
    const analytics = await supplierService.getSupplierAnalytics();
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get supplier analytics",
      error: error.message,
    });
  }
};
