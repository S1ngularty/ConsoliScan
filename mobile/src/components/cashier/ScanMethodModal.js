import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

const ScanMethodModal = ({ visible, onClose, navigation }) => {
  const networkState = useSelector((state) => state.network);
  const isOffline = networkState?.isOffline || networkState?.isServerDown;

  const handleOptionSelect = (option) => {
    onClose();

    switch (option) {
      case "barcode":
        navigation.navigate("BarcodeScan");
        break;
      case "qr":
        navigation.navigate("QRScanning");
        break;
      case "manual":
        navigation.navigate("ManualEntry");
        break;
      case "offline":
        // Navigate to OfflineCheckoutScreen from CashierStackNavigator
        navigation.navigate("OfflineCheckout", {
          checkoutId: `checkout-${Date.now()}`,
          checkoutData: {},
        });
        break;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Item</Text>
                <Text style={styles.modalSubtitle}>Choose scanning method</Text>
              </View>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {/* Barcode Scanning */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => handleOptionSelect("barcode")}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.optionIcon, { backgroundColor: "#DBEAFE" }]}
                  >
                    <MaterialIcons name="barcode" size={28} color="#1D4ED8" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Barcode Scanning</Text>
                    <Text style={styles.optionDescription}>
                      Scan standard product barcodes
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {/* QR Code Scanning - Disabled when offline */}
                {!isOffline && (
                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleOptionSelect("qr")}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: "#F0FDF4" },
                      ]}
                    >
                      <MaterialIcons
                        name="qr-code-scanner"
                        size={28}
                        color="#059669"
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>QR Code Scan</Text>
                      <Text style={styles.optionDescription}>
                        Scan QR checkout code
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                )}

                {/* Offline Checkout - Only shown when offline */}
                {isOffline && (
                  <TouchableOpacity
                    style={[styles.optionCard, styles.offlineOptionCard]}
                    onPress={() => handleOptionSelect("offline")}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: "#FEF3C7" },
                      ]}
                    >
                      <MaterialIcons
                        name="router-offline"
                        size={28}
                        color="#DC2626"
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>Offline Checkout</Text>
                      <Text style={styles.optionDescription}>
                        Process customer QR codes offline
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color="#DC2626"
                    />
                  </TouchableOpacity>
                )}

                {/* Manual Entry */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => handleOptionSelect("manual")}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.optionIcon, { backgroundColor: "#FEF3C7" }]}
                  >
                    <MaterialIcons name="keyboard" size={28} color="#D97706" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Manual Entry</Text>
                    <Text style={styles.optionDescription}>
                      Enter checkout code manually
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  optionsContainer: {
    padding: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginBottom: 12,
  },
  offlineOptionCard: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
});

export default ScanMethodModal;
