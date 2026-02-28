import React, { useState, useRef, useEffect, useCallback } from "react";
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
  ToastAndroid,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BarcodeScanner from "../../components/BarcodeScanner";
import ProductDetailSheet from "../../components/ProductDetailSheet";
import { scanProduct } from "../../api/product.api";
import { checkNetworkStatus } from "../../utils/netUtil";
import {
  addToCart,
  removeFromCart,
  startSession,
} from "../../features/slices/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { debounceCartSync } from "../../features/slices/cart/cartDebounce";
import { fetchCatalogFromServer } from "../../features/slices/product/productThunks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveLocally } from "../../features/slices/cart/cartThunks";
import SessionModal from "../../components/Customer/SessionModal";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const ScanningScreen = ({ navigation }) => {
  const [scannedProduct, setScannedProduct] = useState(null);
  const [manualBarcodeVisible, setManualBarcodeVisible] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [isScanningLocked, setIsScanningLocked] = useState(false);
  const [scanStatus, setScanStatus] = useState("Ready to scan");
  const [scanProgress, setScanProgress] = useState(0);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const toastPosition = useRef(new Animated.Value(100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const sheetPosition = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scanLockTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const isUndoActionRef = useRef(false);
  // ✅ FIX: Use a ref to track toast visibility so timeout callbacks
  // always read the current value instead of a stale closure value.
  const isToastVisibleRef = useRef(false);

  // Scan consistency verification
  const scanBufferRef = useRef([]);
  const CONSISTENCY_THRESHOLD = 10; // Number of identical scans needed
  const SCAN_TIMEOUT_MS = 1000; // Clear scans older than this
  const resetTimeoutRef = useRef(null);

  const dispatch = useDispatch();
  const cartState = useSelector((state) => state.cart);
  const userState = useSelector((state) => state.auth);
  const catalogProducts = useSelector((state) => state.product?.products || []);
  console.log("Catalog Products:", catalogProducts.length);

  // Refresh catalog when screen is focused
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchCatalogFromServer());

      // Check if session is active, if not show modal
      if (!cartState.sessionActive) {
        setShowSessionModal(true);
      }
    }, [dispatch, cartState.sessionActive]),
  );

  // Handler for starting shopping session
  const handleStartSession = async () => {
    dispatch(startSession());
    await dispatch(saveLocally());
    setShowSessionModal(false);
    console.log("🎬 [SCANNING] Shopping session started");
  };

  const handleCancelSession = () => {
    setShowSessionModal(false);
    // Navigate back to home
    navigation.goBack();
  };

  useEffect(() => {
    return () => {
      if (scanLockTimeoutRef.current) clearTimeout(scanLockTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const handleScanHistory = async (product) => {
    try {
      const scanHistory = await AsyncStorage.getItem("scanHistory");
      const newScan = {
        name: product.name,
        price: product.price,
        scannedAt: Date.now(),
      };

      if (!scanHistory) {
        await AsyncStorage.setItem("scanHistory", JSON.stringify([newScan]));
      } else {
        const currScanned = JSON.parse(scanHistory);
        if (currScanned.length >= 4) currScanned.shift();
        currScanned.push(newScan);
        await AsyncStorage.setItem("scanHistory", JSON.stringify(currScanned));
      }
    } catch (error) {
      console.log("Error saving scan history:", error);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetPosition.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeSheet();
        } else {
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

  const hideToastNotification = () => {
    // ✅ FIX: Check the ref instead of the stale `showToast` state value.
    if (!isToastVisibleRef.current) return;

    Animated.parallel([
      Animated.spring(toastPosition, {
        toValue: 100,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isToastVisibleRef.current = false;
      setShowToast(false);
      setToastMessage(null);
      setLastAddedItem(null);

      if (isUndoActionRef.current) {
        debounceCartSync(dispatch);
        isUndoActionRef.current = false;
      }
    });
  };

  const showToastNotification = (
    message,
    item,
    isUndo = false,
    isContinuous = false,
  ) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    const showNewToast = () => {
      setToastMessage(message);
      setLastAddedItem(item);
      setShowToast(true);
      isToastVisibleRef.current = true; // ✅ FIX: Keep ref in sync with state

      Animated.parallel([
        Animated.spring(toastPosition, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // ✅ FIX: hideToastNotification now reads from the ref, so this
      // timeout will correctly hide the toast when it fires.
      const duration = isContinuous ? 1200 : 2500;
      toastTimeoutRef.current = setTimeout(() => {
        hideToastNotification();
      }, duration);
    };

    // ✅ FIX: Check ref instead of showToast state for current visibility
    if (isToastVisibleRef.current) {
      // Animate out quickly, then show new toast
      Animated.parallel([
        Animated.timing(toastPosition, {
          toValue: 100,
          useNativeDriver: true,
          duration: 150,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        showNewToast();
      });
    } else {
      showNewToast();
    }
  };

  const handleUndoAddToCart = () => {
    if (lastAddedItem) {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }

      dispatch(removeFromCart(lastAddedItem._id));
      isUndoActionRef.current = true;
      setLastAddedItem(null);
      hideToastNotification();

      if (Platform.OS === "android") {
        ToastAndroid.show("Item removed from cart", ToastAndroid.SHORT);
      }
    }
  };

  const handleDetection = async (type, data) => {
    if (isScanningLocked) {
      return;
    }

    const now = Date.now();

    // Add current scan to buffer
    scanBufferRef.current.push({
      barcode: data,
      type: type,
      timestamp: now,
    });

    // Remove old scans outside the time window
    scanBufferRef.current = scanBufferRef.current.filter(
      (scan) => now - scan.timestamp < SCAN_TIMEOUT_MS,
    );

    // Get the last N scans
    const recentScans = scanBufferRef.current.slice(-CONSISTENCY_THRESHOLD);

    // Calculate progress percentage
    const progress = (recentScans.length / CONSISTENCY_THRESHOLD) * 100;
    setScanProgress(progress);

    // Auto-reset: Clear progress if no new scans for 1.5 seconds
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(() => {
      if (!isScanningLocked) {
        setScanProgress(0);
        scanBufferRef.current = [];
        setScanStatus("Ready to scan");
      }
    }, 1500);

    // Update status
    const uniqueBarcodes = new Set(scanBufferRef.current.map((s) => s.barcode));
    if (recentScans.length < CONSISTENCY_THRESHOLD) {
      setScanStatus(
        `Verifying... ${recentScans.length}/${CONSISTENCY_THRESHOLD}`,
      );
      return;
    }

    // Check if all recent scans are identical
    const allSame = recentScans.every(
      (scan) => scan.barcode === recentScans[0].barcode,
    );

    if (!allSame) {
      setScanStatus(`Scanning... (${uniqueBarcodes.size} detected)`);
      return;
    }

    // Consistency verified! Process the scan
    const verifiedBarcode = recentScans[0].barcode;
    console.log(
      `✓ Scan verified: ${verifiedBarcode} (${CONSISTENCY_THRESHOLD}x consistent)`,
    );

    // Clear auto-reset timeout since we're processing
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Lock scanning and clear buffer
    setIsScanningLocked(true);
    scanBufferRef.current = [];
    setScanStatus("Processing...");

    // Keep progress at 100% briefly to show completion animation
    // Then reset after animation completes (500ms for bounce effect)
    setTimeout(() => {
      setScanProgress(0);
    }, 500);

    try {
      let response = catalogProducts.find(
        (product) => String(product.barcode) === String(verifiedBarcode),
      );

      if (!response) {
        const networkStatus = await checkNetworkStatus();
      }

      if (response) {
        await handleScanHistory(response);

        if (continuousMode) {
          handleAddToContinuous(response);
        } else {
          setScannedProduct(response);
          openSheet();
        }
      } else {
        showToastNotification("Product not found", null, false, false);
      }
    } catch (err) {
      console.log("Product not found or API error:", err);
      showToastNotification("Product not found", null, false, false);
    } finally {
      if (scanLockTimeoutRef.current) {
        clearTimeout(scanLockTimeoutRef.current);
      }

      // Minimum 1 second delay to ensure data is fully fetched/processed
      // before allowing next scan
      scanLockTimeoutRef.current = setTimeout(() => {
        setIsScanningLocked(false);
        setScanProgress(0); // Final reset to ensure clean state
        setScanStatus("Ready to scan");
      }, 1200);
    }
  };

  const handleAddToContinuous = (product) => {
    const newItem = {
      ...product,
      selectedQuantity: 1,
      addedAt: new Date().toISOString(),
    };

    setLastAddedItem(newItem);
    dispatch(addToCart(newItem));
    debounceCartSync(dispatch);

    showToastNotification(
      `${product.name} added to cart`,
      newItem,
      false,
      true,
    );
  };

  const handleAddToCart = (product, quantity) => {
    const newItem = {
      ...product,
      selectedQuantity: quantity,
      addedAt: new Date().toISOString(),
    };

    setLastAddedItem(newItem);
    dispatch(addToCart(newItem));
    debounceCartSync(dispatch);
    closeSheet();

    showToastNotification(
      `${product.name} added to cart`,
      newItem,
      false,
      false,
    );
  };

  const handleManualBarcodeSubmit = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert("Error", "Please enter a barcode");
      return;
    }

    setIsSearching(true);
    try {
      console.log(`Searching for barcode: ${manualBarcode}`);

      let response = catalogProducts.find(
        (product) => String(product.barcode) === String(manualBarcode.trim()),
      );

      if (!response) {
        const networkStatus = await checkNetworkStatus();

        if (!networkStatus.isConnected) {
          Alert.alert(
            "Product Not Found",
            "Product not found in local catalog and you are offline",
          );
          setIsSearching(false);
          return;
        }

        response = await scanProduct(manualBarcode.trim());
      }

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

  const getProductImageUrl = (product) => {
    if (product?.images && product.images.length > 0) {
      return product.images[0].url;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <BarcodeScanner onDetect={handleDetection} scanProgress={scanProgress} />

      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.header} edges={["top"]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>{/* Empty view for balance */}</View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.modeToggleButton,
                continuousMode && styles.modeToggleActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setContinuousMode(!continuousMode)}
            >
              <MaterialCommunityIcons
                name={
                  continuousMode ? "lightning-bolt" : "lightning-bolt-outline"
                }
                size={18}
                color={continuousMode ? "#fff" : "#fff"}
              />
              <Text
                style={[
                  styles.modeToggleText,
                  continuousMode && styles.modeToggleTextActive,
                ]}
              >
                {continuousMode ? "Fast" : "Detail"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => setManualBarcodeVisible(true)}
            >
              <MaterialCommunityIcons name="keyboard" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cartButton}
              activeOpacity={0.7}
              onPress={() => {
                if (userState.role === "user") {
                  navigation.navigate("HomeTabs", { screen: "Cart" });
                } else {
                  navigation.navigate("Cart");
                }
              }}
            >
              <MaterialCommunityIcons
                name="cart-outline"
                size={22}
                color="#fff"
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

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>{scanStatus}</Text>
      </View>

      {/* Product Detail Modal */}
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
            <View style={styles.sheetHandle} />
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
        animationType="slide"
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
                style={styles.closeButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.manualInputContainer}>
              <MaterialCommunityIcons
                name="barcode-scan"
                size={24}
                color="#00A86B"
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

      {/* Toast Notification */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: toastPosition }],
              opacity: toastOpacity,
            },
          ]}
        >
          <View style={styles.toastContent}>
            <View style={styles.toastLeftSection}>
              {lastAddedItem && (
                <View style={styles.toastImageContainer}>
                  {getProductImageUrl(lastAddedItem) ? (
                    <Image
                      source={{ uri: getProductImageUrl(lastAddedItem) }}
                      style={styles.toastImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.toastImagePlaceholder}>
                      <MaterialCommunityIcons
                        name="image-off"
                        size={16}
                        color="#94A3B8"
                      />
                    </View>
                  )}
                </View>
              )}

              <View style={styles.toastMessage}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color="#00A86B"
                />
                <Text style={styles.toastText} numberOfLines={2}>
                  {toastMessage}
                </Text>
              </View>
            </View>

            {lastAddedItem && (
              <TouchableOpacity
                style={styles.undoButton}
                onPress={handleUndoAddToCart}
                activeOpacity={0.7}
              >
                <Text style={styles.undoButtonText}>UNDO</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      <SessionModal
        visible={showSessionModal}
        onStartSession={handleStartSession}
        onCancel={handleCancelSession}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 5,
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
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modeToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modeToggleActive: {
    backgroundColor: "#00A86B",
    borderColor: "#00A86B",
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modeToggleTextActive: {
    color: "#fff",
  },
  cartButton: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 4,
  },
  instructionContainer: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 8,
  },
  instructionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
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
    top: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
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
  },
  manualModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  manualModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  closeButton: {
    padding: 4,
  },
  manualInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  barcodeInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    padding: 0,
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
  toastContainer: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#00A86B",
  },
  toastLeftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toastImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  toastImage: {
    width: 40,
    height: 40,
  },
  toastImagePlaceholder: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  toastMessage: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toastText: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  undoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#00A86B",
    borderRadius: 22,
    marginLeft: 12,
  },
  undoButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});

export default ScanningScreen;
