const StoreSettings = require("../models/storeSettingsModel");

const SETTINGS_ID = "store_settings";

// ═══════════════════════════════════════════════
//  GET SETTINGS
// ═══════════════════════════════════════════════
exports.getSettings = async () => {
  let settings = await StoreSettings.findById(SETTINGS_ID).populate(
    "lastUpdatedBy",
    "name email",
  );

  // Create default settings if not exists
  if (!settings) {
    settings = await StoreSettings.create({
      _id: SETTINGS_ID,
      businessHours: {
        monday: { open: "08:00", close: "20:00", closed: false },
        tuesday: { open: "08:00", close: "20:00", closed: false },
        wednesday: { open: "08:00", close: "20:00", closed: false },
        thursday: { open: "08:00", close: "20:00", closed: false },
        friday: { open: "08:00", close: "20:00", closed: false },
        saturday: { open: "08:00", close: "20:00", closed: false },
        sunday: { open: "10:00", close: "18:00", closed: false },
      },
    });
  }

  return settings;
};

// ═══════════════════════════════════════════════
//  UPDATE SETTINGS
// ═══════════════════════════════════════════════
exports.updateSettings = async (updateData, userId) => {
  return await StoreSettings.findByIdAndUpdate(
    SETTINGS_ID,
    {
      ...updateData,
      lastUpdatedBy: userId,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  ).populate("lastUpdatedBy", "name email");
};

// ═══════════════════════════════════════════════
//  UPDATE SPECIFIC SECTION
// ═══════════════════════════════════════════════
exports.updateBusinessHours = async (businessHours, userId) => {
  return await this.updateSettings({ businessHours }, userId);
};

exports.updateReceiptSettings = async (receiptSettings, userId) => {
  return await this.updateSettings(receiptSettings, userId);
};

exports.updateTaxSettings = async (taxSettings, userId) => {
  return await this.updateSettings(taxSettings, userId);
};
