import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BarcodeScanner from "../../components/BarcodeScanner";
import { verifyReplacementPrice } from "../../api/exchange.api";

const ExchangeScannerScreen = ({ navigation, route }) => {
  const { exchangeId, originalPrice } = route.params || {};
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastScanned, setLastScanned] = useState("");

  const handleDetection = async (type, barcode) => {
    // Prevent duplicate scans
    if (barcode === lastScanned || isVerifying) return;

    setLastScanned(barcode);
    setIsVerifying(true);

    try {
      console.log(`[Exchange Scanner] Verifying barcode: ${barcode}`);
      const response = await verifyReplacementPrice(exchangeId, barcode);

      if (response.isValid) {
        // Valid replacement - navigate back to exchange screen
        Alert.alert(
          "Valid Replacement!",
          `${response.product.name}\n₱${response.product.price.toFixed(2)}\n\nPlease show this item to the cashier to complete the exchange.`,
          [
            {
              text: "Continue",
              onPress: () => {
                navigation.goBack();
              },
            },
          ],
        );
      } else {
        // Invalid price - let them scan again
        Alert.alert(
          "Invalid Price",
          response.message ||
            `This item costs ₱${response.product?.price.toFixed(2)}. Please find an item that costs exactly ₱${originalPrice.toFixed(2)}.`,
          [
            {
              text: "Scan Again",
              onPress: () => {
                setLastScanned("");
                setIsVerifying(false);
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("[Exchange Scanner] Error:", error);
      Alert.alert(
        "Product Not Found",
        "Unable to find this product. Please try scanning again.",
        [
          {
            text: "OK",
            onPress: () => {
              setLastScanned("");
              setIsVerifying(false);
            },
          },
        ],
      );
    } finally {
      if (!isVerifying) {
        setTimeout(() => setIsVerifying(false), 2000);
      }
    }
  };

  return (
    <View style={styles.container}>
      <BarcodeScanner onDetect={handleDetection} />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Scan Replacement Item</Text>
            <Text style={styles.headerSubtitle}>
              Must cost exactly ₱{originalPrice?.toFixed(2)}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* Instructions Card */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.instructionText}>
            Pick an item from the shelf
          </Text>
        </View>

        <View style={styles.instructionItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.instructionText}>
            Scan the barcode of your chosen item
          </Text>
        </View>

        <View style={styles.instructionItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.instructionText}>
            Show the item to cashier to complete
          </Text>
        </View>

        <View style={styles.priceReminder}>
          <MaterialCommunityIcons
            name="information"
            size={18}
            color="#F59E0B"
          />
          <Text style={styles.priceReminderText}>
            Item must be exactly ₱{originalPrice?.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Loading Overlay */}
      {isVerifying && (
        <View style={styles.verifyingOverlay}>
          <View style={styles.verifyingCard}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.verifyingText}>Verifying product...</Text>
          </View>
        </View>
      )}

      {/* Scanning Guide */}
      <View style={styles.scanGuide}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanGuideText}>Align barcode within the frame</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  instructionsCard: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 20,
    zIndex: 5,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  priceReminder: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  priceReminderText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
  },
  scanGuide: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 3,
    borderColor: "#10B981",
    borderRadius: 12,
    marginBottom: 16,
  },
  scanGuideText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  verifyingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  verifyingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    minWidth: 200,
  },
  verifyingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 16,
  },
});

export default ExchangeScannerScreen;
