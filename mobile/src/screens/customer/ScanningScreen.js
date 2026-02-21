import React, { useState, useRef } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BarcodeScanner from "../../components/BarcodeScanner";
import ProductDetailSheet from "../../components/ProductDetailSheet";
import { scanProduct } from "../../api/product.api";
import { addToCart } from "../../features/slices/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { saveLocally } from "../../features/slices/cart/cartThunks";
import { debounceCartSync } from "../../features/slices/cart/cartDebounce";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ScanningScreen = ({ navigation }) => {
  const [scannedProduct, setScannedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [manualBarcodeVisible, setManualBarcodeVisible] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const sheetPosition = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dispatch = useDispatch();
  const cartState = useSelector((state) => state.cart);
  const userState = useSelector((state) => state.auth);

  const handleScanHistory = async (product) => {
    const scanHistory = await AsyncStorage.getItem("scanHistory");
    if (!scanHistory) {
      AsyncStorage.setItem(
        "scanHistory",
        JSON.stringify([
          {
            name: product.name,
            price: product.price,
            scannedAt: Date.now(),
          },
        ]),
      );
    } else {
      const currScanned = JSON.parse(scanHistory);
      if (currScanned.length >= 4) currScanned.shift();
      currScanned.push({
        name: product.name,
        price: product.price,
        scannedAt: Date.now(),
      });

      AsyncStorage.setItem("scanHistory", JSON.stringify(currScanned));
    }

    return;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        if (gestureState.dy > 0) {
          sheetPosition.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          // Snap back to top
          Animated.spring(sheetPosition, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 12,
          }).start();
        }
      },
    }),
  ).current;

  const handleDetection = async (type, data) => {
    try {
      console.log(`Searching for: ${data} (${type})`);
      const response = await scanProduct(type,data);

      if (response) {
        setScannedProduct(response);
        openSheet();
        handleScanHistory(response);
      }
    } catch (err) {
      console.log("Product not found or API error:", err);
    }
  };

  const handleAddToCart = (product, quantity) => {
    const newItem = {
      ...product,
      selectedQuantity: quantity,
      addedAt: new Date().toISOString(),
    };

    dispatch(addToCart(newItem));
    debounceCartSync(dispatch);
    // dispatch(saveLocally())
    closeSheet();
  };

  const handleManualBarcodeSubmit = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert("Error", "Please enter a barcode");
      return;
    }

    setIsSearching(true);
    try {
      console.log(`Searching for barcode: ${manualBarcode}`);
      const response = await scanProduct(manualBarcode.trim());

      if (response) {
        setScannedProduct(response);
        handleScanHistory(response);
        setManualBarcodeVisible(false);
        setManualBarcode("");
        openSheet();
      } else {
        Alert.alert(
          "Product Not Found",
          `No product found with barcode: ${manualBarcode}`,
        );
      }
    } catch (err) {
      console.log("Error searching product:", err);
      Alert.alert(
        "Search Error",
        "Failed to search for product. Please try again.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const openSheet = () => {
    // Start from bottom and slide up to 0 (fully visible)
    sheetPosition.setValue(SCREEN_HEIGHT);
    Animated.spring(sheetPosition, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  };

  const closeSheet = () => {
    Animated.spring(sheetPosition, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start(() => {
      setScannedProduct(null);
    });
  };

  const translateY = sheetPosition;

  return (
    <View style={styles.container}>
      <BarcodeScanner onDetect={handleDetection} />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <MaterialCommunityIcons
                name="barcode-scan"
                size={20}
                color="#00A86B"
              />
            </View>
            <Text style={styles.logoText}>
              Consoli<Text style={styles.logoBold}>Scan</Text>
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.manualButton}
              activeOpacity={0.7}
              onPress={() => setManualBarcodeVisible(true)}
            >
              <MaterialCommunityIcons name="keyboard" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cartButton}
              activeOpacity={0.7}
              onPress={() => {
                // console.log(userState.role);
                if (userState.role === "user") {
                  navigation.navigate("HomeTabs", {
                    screen: "Cart",
                  });
                } else {
                  navigation.navigate("Cart");
                }
              }}
            >
              <MaterialCommunityIcons
                name="cart-outline"
                size={24}
                color="#000"
              />
              {cartState.cart.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartState.cart.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        animationType="none"
        transparent={true}
        visible={!!scannedProduct}
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeSheet}
        >
          <Animated.View
            style={[styles.sheetContainer, { transform: [{ translateY }] }]}
            {...panResponder.panHandlers}
          >
            <ProductDetailSheet
              product={scannedProduct}
              onConfirm={handleAddToCart}
              onCancel={closeSheet}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Manual Barcode Input Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={manualBarcodeVisible}
        statusBarTranslucent
        onRequestClose={() => {
          setManualBarcodeVisible(false);
          setManualBarcode("");
        }}
      >
        <View style={styles.manualModalOverlay}>
          <View style={styles.manualModalContent}>
            <View style={styles.manualModalHeader}>
              <Text style={styles.manualModalTitle}>Enter Barcode</Text>
              <TouchableOpacity
                onPress={() => {
                  setManualBarcodeVisible(false);
                  setManualBarcode("");
                }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={28}
                  color="#1E293B"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.manualInputContainer}>
              <MaterialCommunityIcons
                name="barcode"
                size={40}
                color="#00A86B"
                style={styles.barcodeIcon}
              />
              <TextInput
                style={styles.barcodeInput}
                placeholder="Enter product barcode"
                placeholderTextColor="#94A3B8"
                value={manualBarcode}
                onChangeText={setManualBarcode}
                autoFocus
                keyboardType="number-pad"
                editable={!isSearching}
              />
            </View>

            <View style={styles.manualModalActions}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  isSearching && styles.disabledButton,
                ]}
                onPress={() => {
                  setManualBarcodeVisible(false);
                  setManualBarcode("");
                }}
                disabled={isSearching}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (isSearching || !manualBarcode.trim()) &&
                    styles.disabledButton,
                ]}
                onPress={handleManualBarcodeSubmit}
                disabled={isSearching || !manualBarcode.trim()}
              >
                {isSearching ? (
                  <Text style={styles.submitButtonText}>Searching...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  manualButton: {
    width: 50,
    height: 50,
    backgroundColor: "#00A86B",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    marginLeft: 10,
    fontSize: 18,
    color: "#000",
    letterSpacing: 0.5,
  },
  logoBold: {
    fontWeight: "900",
  },
  cartButton: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#00A86B",
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0, // Make it fill from top to bottom
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  // Manual Barcode Modal Styles
  manualModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  manualModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  manualModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  manualModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  manualInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  barcodeIcon: {
    marginRight: 12,
  },
  barcodeInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    paddingVertical: 8,
  },
  manualModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ScanningScreen;
