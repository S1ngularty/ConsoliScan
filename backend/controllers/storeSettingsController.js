const storeSettingsService = require("../services/storeSettingsService");

exports.getSettings = async (req, res) => {
  try {
    const settings = await storeSettingsService.getSettings();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch settings",
      error: error.message,
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await storeSettingsService.updateSettings(
      req.body,
      req.user.id,
    );

    res.status(200).json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update settings",
      error: error.message,
    });
  }
};

exports.updateBusinessHours = async (req, res) => {
  try {
    const settings = await storeSettingsService.updateBusinessHours(
      req.body,
      req.user.id,
    );

    res.status(200).json({
      message: "Business hours updated successfully",
      settings,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update business hours",
      error: error.message,
    });
  }
};

exports.updateReceiptSettings = async (req, res) => {
  try {
    const settings = await storeSettingsService.updateReceiptSettings(
      req.body,
      req.user.id,
    );

    res.status(200).json({
      message: "Receipt settings updated successfully",
      settings,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update receipt settings",
      error: error.message,
    });
  }
};

exports.updateTaxSettings = async (req, res) => {
  try {
    const settings = await storeSettingsService.updateTaxSettings(
      req.body,
      req.user.id,
    );

    res.status(200).json({
      message: "Tax settings updated successfully",
      settings,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update tax settings",
      error: error.message,
    });
  }
};
