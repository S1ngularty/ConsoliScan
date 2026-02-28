import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Animated,
  ToastAndroid,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { scanProduct } from "../../api/product.api";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../../features/slices/cart/cartSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { confirmOrder } from "../../api/order.api";
import { readPromos, writePromos } from "../../utils/promoStorage";

const { width, height } = Dimensions.get("window");

const BarcodeScanningScreen = ({ navigation, route }) => {
  const [scannedItems, setScannedItems] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [manualBarcodeVisible, setManualBarcodeVisible] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [scanStatus, setScanStatus] = useState("Ready to scan");
  const [scanProgress, setScanProgress] = useState(0);

  // Payment states
  const [stage, setStage] = useState("scan"); // scan | payment
  const [customerType, setCustomerType] = useState("regular"); // regular | senior | pwd
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoCatalog, setPromoCatalog] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [bookletConfirmed, setBookletConfirmed] = useState(false);
  const [discountData, setDiscountData] = useState(null);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const isProcessingRef = useRef(false);
  const processingTimeoutRef = useRef(null);
  const cameraRef = useRef(null);
  const toastPosition = useRef(new Animated.Value(-100)).current;

  // Scan consistency verification
  const scanBufferRef = useRef([]);
  const CONSISTENCY_THRESHOLD = 10; // Number of identical scans needed
  const SCAN_TIMEOUT_MS = 1000; // Clear scans older than this
  const resetTimeoutRef = useRef(null);

  const dispatch = useDispatch();
  const catalogProducts = useSelector((state) => state.product?.products || []);
  const { isOffline, isServerDown } = useSelector((state) => state.network);

  // Derived network status: online when NOT offline AND server is reachable
  const isOnline = !isOffline && !isServerDown;

  // Get user eligibility from route params if coming from TransactionScreen
  const userEligibility = route.params?.userEligibility || {};
  const { isSenior = false, isPWD = false } = userEligibility;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Calculate total price when scanned items change
  useEffect(() => {
    const total = scannedItems.reduce((sum, item) => {
      const itemPrice = item.price || 0;
      const itemQty = item.quantity || 1;
      return sum + itemPrice * itemQty;
    }, 0);
    setTotalPrice(Math.max(0, total || 0));
  }, [scannedItems]);

  // Load discounts when entering payment stage
  useEffect(() => {
    if (stage === "payment") {
      loadDiscountData();
      loadPromoData();
    }
  }, [stage]);

  const loadDiscountData = async () => {
    setLoadingDiscounts(true);
    try {
      if (isOnline) {
        // Fetch from backend
        try {
          const response = await fetch(
            "http://your-backend/api/v1/discounts/current",
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            },
          );
          const data = await response.json();
          setDiscountData(data);
          // Cache it locally
          await AsyncStorage.setItem(
            "cachedDiscountData",
            JSON.stringify(data),
          );
        } catch (error) {
          console.warn("Failed to fetch discounts, using cache:", error);
          // Fall back to cached data
          const cached = await AsyncStorage.getItem("cachedDiscountData");
          if (cached) {
            setDiscountData(JSON.parse(cached));
          }
        }
      } else {
        // Load from localStorage
        const cached = await AsyncStorage.getItem("cachedDiscountData");
        if (cached) {
          setDiscountData(JSON.parse(cached));
        } else {
          // Use default discounts
          setDiscountData({
            seniorPwdDiscount: 0.05,
            weeklyCap: 125,
            weeklyPurchaseCap: 2500,
          });
        }
      }
    } catch (error) {
      console.error("Error loading discounts:", error);
      // Use default
      setDiscountData({
        seniorPwdDiscount: 0.05,
        weeklyCap: 125,
        weeklyPurchaseCap: 2500,
      });
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const loadPromoData = async () => {
    setLoadingPromos(true);
    try {
      if (isOnline) {
        // Online: Fetch all promos from backend
        try {
          const response = await fetch(
            "http://your-backend/api/v1/promos/active",
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            },
          );
          const data = await response.json();
          // Validate and normalize promo data to handle backend structure
          const promos = (data || []).map((promo) => {
            // Extract name from promoName.promo or fallback to name field
            const promoNameValue =
              typeof promo.promoName === "object"
                ? promo.promoName?.promo || promo.name || "Unnamed Promo"
                : promo.promoName || promo.name || "Unnamed Promo";

            // Get discount amount from value or discountAmount field
            const discountValue =
              promo.value !== undefined
                ? promo.value
                : promo.discountAmount || 0;

            // Get promo type from promoType or discountType field
            const promoTypeValue =
              promo.promoType || promo.discountType || "fixed";

            return {
              ...promo,
              code: promo.code || "UNKNOWN",
              name: promoNameValue,
              discountAmount:
                typeof discountValue === "number" ? discountValue : 0,
              discountType: promoTypeValue,
              isUnlimited: promo.isUnlimited === true,
            };
          });
          setPromoCatalog(promos);
          // Cache all promos
          await writePromos(promos);
        } catch (fetchError) {
          console.warn("Failed to fetch promos from backend:", fetchError);
          // Fall back to cached data - show all cached promos when online fetch fails
          const cachedPromos = await readPromos();
          console.log("Raw cached promos:", cachedPromos);

          // Normalize cached promos (they might have old backend structure)
          const normalizedCached = cachedPromos.map((promo) => {
            const promoNameValue =
              typeof promo.promoName === "object"
                ? promo.promoName?.promo || promo.name || "Unnamed Promo"
                : promo.promoName || promo.name || "Unnamed Promo";

            const discountValue =
              promo.value !== undefined
                ? promo.value
                : promo.discountAmount || 0;
            const promoTypeValue =
              promo.promoType || promo.discountType || "fixed";

            return {
              ...promo,
              code: promo.code || "UNKNOWN",
              name: promoNameValue,
              discountAmount:
                typeof discountValue === "number" ? discountValue : 0,
              discountType: promoTypeValue,
              isUnlimited: promo.isUnlimited === true,
            };
          });

          console.log("Normalized cached promos:", normalizedCached);
          setPromoCatalog(normalizedCached);
        }
      } else {
        // Offline: Load cached promos and filter to unlimited only
        try {
          const allPromos = await readPromos();
          console.log("All cached promos (offline mode):", allPromos);

          // Normalize cached promos first
          const normalizedPromos = allPromos.map((promo) => {
            const promoNameValue =
              typeof promo.promoName === "object"
                ? promo.promoName?.promo || promo.name || "Unnamed Promo"
                : promo.promoName || promo.name || "Unnamed Promo";

            const discountValue =
              promo.value !== undefined
                ? promo.value
                : promo.discountAmount || 0;
            const promoTypeValue =
              promo.promoType || promo.discountType || "fixed";

            return {
              ...promo,
              code: promo.code || "UNKNOWN",
              name: promoNameValue,
              discountAmount:
                typeof discountValue === "number" ? discountValue : 0,
              discountType: promoTypeValue,
              isUnlimited: promo.isUnlimited === true,
            };
          });

          // Filter only unlimited promos for offline use
          const unlimitedPromos = normalizedPromos.filter(
            (promo) => promo.isUnlimited === true,
          );

          console.log(
            `Offline mode: ${unlimitedPromos.length} unlimited promos found out of ${normalizedPromos.length} total`,
          );

          // If no unlimited promos found, show warning and display all cached promos
          if (unlimitedPromos.length === 0 && normalizedPromos.length > 0) {
            console.warn(
              "⚠️ No unlimited promos in cache. Backend should set 'isUnlimited: true' for offline usage.",
              "Showing all cached promos as fallback.",
            );
            setPromoCatalog(normalizedPromos); // Show all as fallback
          } else {
            setPromoCatalog(unlimitedPromos);
          }
        } catch (storageError) {
          console.warn("Failed to load cached promos:", storageError);
          setPromoCatalog([]);
        }
      }
    } catch (error) {
      console.error("Error loading promos:", error);
      setPromoCatalog([]);
    } finally {
      setLoadingPromos(false);
    }
  };

  // Evaluate promo validity and calculate discount (similar to OfflineCheckoutScreen)
  const evaluatePromoLocal = useCallback(
    (promo) => {
      if (!promo) {
        return { valid: false, reason: "No promo selected", discount: 0 };
      }

      const now = new Date();

      // Check if promo is active
      if (promo.active === false) {
        return { valid: false, reason: "Promo not active", discount: 0 };
      }

      // Check start date
      if (promo.startDate && now < new Date(promo.startDate)) {
        return { valid: false, reason: "Promo not started yet", discount: 0 };
      }

      // Check end date
      if (promo.endDate && now > new Date(promo.endDate)) {
        return { valid: false, reason: "Promo expired", discount: 0 };
      }

      // Check usage limit
      if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
        return {
          valid: false,
          reason: "Promo usage limit exceeded",
          discount: 0,
        };
      }

      // Check minimum purchase requirement
      if (promo.minPurchase && totalPrice < promo.minPurchase) {
        return {
          valid: false,
          reason: `Minimum purchase of ₱${promo.minPurchase} required`,
          discount: 0,
        };
      }

      // Calculate discount based on promo type
      let discount = 0;
      const promoType = promo.promoType || promo.type || "fixed";

      if (promoType === "percentage") {
        discount =
          totalPrice * (Number(promo.value || promo.discountAmount || 0) / 100);
      } else {
        // Fixed amount - cap at total price
        discount = Math.min(
          Number(promo.value || promo.discountAmount || 0),
          totalPrice,
        );
      }

      discount = Math.max(0, discount); // Ensure non-negative

      return {
        valid: true,
        discount,
        reason: null,
        promo,
      };
    },
    [totalPrice],
  );

  const showToastNotification = (message, item = null) => {
    setToastMessage(message);
    setShowToast(true);
    if (item) {
      setLastAddedItem(item);
    }

    Animated.timing(toastPosition, {
      toValue: 20,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      hideToastNotification();
    }, 3000);
    return timeout;
  };

  const hideToastNotification = () => {
    Animated.timing(toastPosition, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowToast(false);
      setLastAddedItem(null);
    });
  };

  const handleUndoAddItem = () => {
    if (lastAddedItem) {
      setScannedItems((prev) =>
        prev.filter((item) => item.id !== lastAddedItem.id),
      );
      hideToastNotification();
      ToastAndroid.show("Item removed", ToastAndroid.SHORT);
    }
  };

  const handleScan = async ({ data, type }) => {
    if (isProcessingRef.current) {
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
      if (!isProcessingRef.current) {
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
    isProcessingRef.current = true;
    scanBufferRef.current = [];
    setIsScanning(false);
    setLoading(true);
    setScanStatus("Processing...");

    // Keep progress at 100% briefly to show completion animation
    // Then reset after animation completes (500ms for bounce effect)
    setTimeout(() => {
      setScanProgress(0);
    }, 500);

    try {
      // Check if item already exists in scanned items
      const existingItemIndex = scannedItems.findIndex(
        (item) => item.barcode === verifiedBarcode,
      );

      if (existingItemIndex > -1) {
        // Item already exists, increment quantity
        const updatedItems = [...scannedItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
          subtotal:
            updatedItems[existingItemIndex].price *
            (updatedItems[existingItemIndex].quantity + 1),
        };
        setScannedItems(updatedItems);

        // Show success feedback
        showToastNotification(
          `Qty: ${updatedItems[existingItemIndex].quantity} - ${updatedItems[existingItemIndex].name}`,
        );
      } else {
        // New item, look for it in local catalog first
        let response = catalogProducts.find(
          (product) => String(product.barcode) === String(verifiedBarcode),
        );

        // If not found locally, check internet before API call
        if (!response) {
          if (!isOnline) {
            Alert.alert(
              "Product Not Found",
              `Product not found in local catalog and you are offline: ${verifiedBarcode}`,
              [{ text: "OK", onPress: () => setIsScanning(true) }],
            );
            return;
          }

          response = await scanProduct(verifiedBarcode, type);
        }

        if (response && response._id) {
          // Extract BNPC eligibility from category
          const isBNPCEligible = response.category?.isBNPC || false;
          const bnpcCategory = response.category?.bnpcCategory || null;

          const newItem = {
            id: response._id,
            name: response.name,
            barcode: response.barcode,
            price: response.price,
            srp: response.srp || response.price, // Use SRP if available, otherwise price
            quantity: 1,
            subtotal: response.price,
            unit: response.unit,
            sku: response.sku,
            category: response.category,
            stockQuantity: response.stockQuantity,
            isBNPCEligible: isBNPCEligible,
            bnpcCategory: bnpcCategory,
            excludedFromDiscount: response.excludedFromDiscount || false,
            images: response.images || [],
          };

          setScannedItems((prev) => [...prev, newItem]);

          // Show success feedback
          showToastNotification(`Added: ${response.name}`, newItem);
        } else {
          Alert.alert(
            "Product Not Found",
            `No product found for barcode: ${verifiedBarcode}`,
            [{ text: "OK", onPress: () => setIsScanning(true) }],
          );
        }
      }
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert("Scan Error", "Failed to scan product. Please try again.", [
        { text: "OK", onPress: () => setIsScanning(true) },
      ]);
    } finally {
      // Clear any existing timeout before setting new one
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      // Minimum 1 second delay to ensure data is fully fetched/processed
      // before allowing next scan
      processingTimeoutRef.current = setTimeout(() => {
        isProcessingRef.current = false;
        setLoading(false);
        setIsScanning(true);
        setScanProgress(0); // Final reset to ensure clean state
        setScanStatus("Ready to scan");
      }, 1200);
    }
  };

  const handleManualBarcodeSubmit = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert("Error", "Please enter a barcode");
      return;
    }

    setIsSearching(true);
    try {
      console.log(`Searching for barcode: ${manualBarcode}`);

      // Look for product in local catalog first
      let response = catalogProducts.find(
        (product) => String(product.barcode) === String(manualBarcode.trim()),
      );

      // If not found locally, check internet before API call
      if (!response) {
        if (!isOnline) {
          Alert.alert(
            "Product Not Found",
            "Product not found in local catalog and you are offline",
          );
          setIsSearching(false);
          return;
        }

        response = await scanProduct(manualBarcode.trim(), "ean13");
      }

      if (response && response._id) {
        // Check if item already exists
        const existingItemIndex = scannedItems.findIndex(
          (item) => item.barcode === response.barcode,
        );

        if (existingItemIndex > -1) {
          // Item exists, increment quantity
          const updatedItems = [...scannedItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + 1,
            subtotal:
              updatedItems[existingItemIndex].price *
              (updatedItems[existingItemIndex].quantity + 1),
          };
          setScannedItems(updatedItems);

          Alert.alert(
            "Item Updated",
            `Quantity increased to ${updatedItems[existingItemIndex].quantity}`,
          );
        } else {
          // Extract BNPC eligibility from category
          const isBNPCEligible = response.category?.isBNPC || false;
          const bnpcCategory = response.category?.bnpcCategory || null;

          const newItem = {
            id: response._id,
            name: response.name,
            barcode: response.barcode,
            price: response.price,
            srp: response.srp || response.price,
            quantity: 1,
            subtotal: response.price,
            unit: response.unit,
            sku: response.sku,
            category: response.category,
            stockQuantity: response.stockQuantity,
            isBNPCEligible: isBNPCEligible,
            bnpcCategory: bnpcCategory,
            excludedFromDiscount: response.excludedFromDiscount || false,
            images: response.images || [],
          };

          setScannedItems((prev) => [...prev, newItem]);

          Alert.alert("Product Added", `Added: ${response.name}`);
        }

        setManualBarcodeVisible(false);
        setManualBarcode("");
      } else {
        Alert.alert(
          "Product Not Found",
          `No product found with barcode: ${manualBarcode}`,
        );
      }
    } catch (error) {
      console.error("Manual search error:", error);
      Alert.alert(
        "Search Error",
        "Failed to search for product. Please try again.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleProceedToPayment = () => {
    if (scannedItems.length === 0) {
      Alert.alert(
        "No Items Scanned",
        "Please scan at least one item before proceeding to payment.",
      );
      return;
    }

    // Transition to payment stage for in-screen payment processing
    setStage("payment");
  };

  const handleCompletePayment = async () => {
    // Validate booklet confirmation
    if (
      (customerType === "senior" || customerType === "pwd") &&
      !bookletConfirmed
    ) {
      Alert.alert(
        "Booklet Not Confirmed",
        "Please confirm that you have updated the customer's booklet.",
      );
      return;
    }

    // Calculate BNPC eligible subtotal
    const bnpcSubtotal = Math.max(
      0,
      scannedItems
        .filter((item) => item.isBNPCEligible && !item.excludedFromDiscount)
        .reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
          0,
        ),
    );

    // Calculate BNPC discount based on customer type
    let bnpcDiscount = 0;
    if (
      (customerType === "senior" || customerType === "pwd") &&
      bnpcSubtotal > 0
    ) {
      bnpcDiscount = Math.min(bnpcSubtotal * 0.05, 125); // 5% discount capped at ₱125
    }

    // Calculate promo discount - use pre-validated amount from appliedPromo
    let promoDiscount = 0;
    let appliedPromoData = null;

    if (appliedPromo) {
      // Re-validate promo before final submission (extra safety check)
      const validation = evaluatePromoLocal(appliedPromo);
      if (validation.valid) {
        promoDiscount = Math.max(0, validation.discount);
        appliedPromoData = {
          code: appliedPromo.code,
          name: appliedPromo.name,
          discount: promoDiscount,
          discountType: appliedPromo.discountType,
        };
      } else {
        // Promo became invalid, show error and allow retry
        Alert.alert(
          "Promo Validation Failed",
          validation.reason || "Selected promo is no longer valid",
          [
            {
              text: "OK",
              onPress: () => setAppliedPromo(null),
            },
          ],
        );
        return;
      }
    }

    const finalTotal = Math.max(
      0,
      (totalPrice || 0) - (bnpcDiscount || 0) - (promoDiscount || 0),
    );

    // Transform scanned items to order format matching backend schema
    const orderItems = scannedItems.map((item) => ({
      product: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.price,
      unit: item.unit,
      itemTotal: item.subtotal,
      isBNPCEligible: item.isBNPCEligible && !item.excludedFromDiscount,
      excludedFromDiscount: item.excludedFromDiscount,
      category: item.category
        ? {
            id: item.category._id || item.category.id,
            name: item.category.categoryName || item.category.name,
            isBNPC: item.category.isBNPC || false,
          }
        : undefined,
      status: "SOLD",
    }));

    // Generate checkout code for idempotency
    const checkoutCode = `CHK-${Date.now().toString().slice(-8)}`;

    // Create transaction payload matching offline cashier structure
    const finalAmountPaid =
      totalPrice - bnpcDiscount - (appliedPromoData?.discount || 0);
    const orderData = {
      items: orderItems,
      baseAmount: totalPrice,
      finalAmountPaid: finalAmountPaid,
      bnpcEligibleSubtotal: bnpcSubtotal,
      bnpcDiscount: {
        autoCalculated: bnpcDiscount,
        total: bnpcDiscount,
      },
      promoDiscount: appliedPromoData
        ? {
            code: appliedPromoData.code,
            amount: appliedPromoData.discount,
            serverValidated: false,
          }
        : { code: null, amount: 0, serverValidated: false },
      customerType: customerType === "regular" ? "regular" : customerType,
      bookletUpdated: bookletConfirmed,
      checkoutCode: checkoutCode,
      status: "CONFIRMED",
      appUser: false,
    };

    setPaymentLoading(true);

    try {
      if (isOnline) {
        // Online: Submit to backend
        try {
          const result = await confirmOrder(orderData);

          // Success - navigate to order summary
          Alert.alert(
            "Order Confirmed",
            "Your order has been processed successfully.",
            [
              {
                text: "OK",
                onPress: () => {
                  dispatch(clearCart());
                  navigation.navigate("OrderSummary", {
                    transactionData: result,
                    checkoutCode: orderData.checkoutCode,
                  });
                },
              },
            ],
          );
        } catch (apiError) {
          // If API fails, ask to store offline
          Alert.alert(
            "API Error",
            "Failed to submit to backend. Store offline?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Store Offline",
                onPress: async () => {
                  await storeOfflineOrder(orderData);
                },
              },
            ],
          );
        }
      } else {
        // Offline: Store to AsyncStorage
        await storeOfflineOrder(orderData);
      }
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to process order. Please try again.",
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const storeOfflineOrder = async (orderData) => {
    try {
      const existingOrders = await AsyncStorage.getItem("offline_transactions");
      const orders = existingOrders ? JSON.parse(existingOrders) : [];

      const pendingOrder = {
        ...orderData,
        id: `${orderData.checkoutCode}_${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: "CONFIRMED",
        localStatus: "pending_sync",
      };

      orders.push(pendingOrder);
      await AsyncStorage.setItem(
        "offline_transactions",
        JSON.stringify(orders),
      );

      Alert.alert(
        "Order Saved Offline",
        "Your order has been saved locally. It will be synced when you go online.",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset screen
              setStage("scan");
              setScannedItems([]);
              setTotalPrice(0);
              setCustomerType("regular");
              setPromoCode("");
              setAppliedPromo(null);
              setBookletConfirmed(false);
              dispatch(clearCart());
              Alert.alert(
                "Order Saved",
                `Checkout Code: ${orderData.checkoutCode}`,
              );
            },
          },
        ],
      );
    } catch (storageError) {
      Alert.alert(
        "Storage Error",
        "Failed to save order locally: " + storageError.message,
      );
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = [...scannedItems];
    newItems.splice(index, 1);
    setScannedItems(newItems);
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(index);
      return;
    }

    // Check stock availability if stockQuantity is available
    const item = scannedItems[index];
    if (item.stockQuantity && newQuantity > item.stockQuantity) {
      Alert.alert(
        "Insufficient Stock",
        `Only ${item.stockQuantity} units available for ${item.name}`,
        [{ text: "OK" }],
      );
      return;
    }

    const updatedItems = [...scannedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity,
      subtotal: updatedItems[index].price * newQuantity,
    };
    setScannedItems(updatedItems);
  };

  const renderPermissionView = () => (
    <View style={styles.permissionContainer}>
      <View style={styles.permissionCard}>
        <MaterialIcons name="camera-alt" size={64} color="#00A86B" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Camera access is needed to scan barcodes for product lookup.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <MaterialIcons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoadingView = () => (
    <View style={styles.cameraContainer}>
      <ActivityIndicator size="large" color="#00A86B" />
      <Text style={styles.loadingText}>Setting up camera...</Text>
    </View>
  );

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean8", "ean13", "upc_a", "upc_e", "code128"],
        }}
        onBarcodeScanned={handleScan}
      />

      {/* Scanner Overlay */}
      <View style={styles.scannerOverlay}>
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Circular Progress Indicator */}
          {scanProgress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressCircle}>
                <View style={styles.progressBackground} />
                <View
                  style={[
                    styles.progressFill,
                    {
                      transform: [
                        { rotate: "-90deg" },
                        {
                          rotate: `${(scanProgress / 100) * 360}deg`,
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.progressInner} />
              </View>
            </View>
          )}
        </View>

        <View style={styles.instructionBox}>
          <MaterialIcons name="qr-code-scanner" size={20} color="#FFFFFF" />
          <Text style={styles.instructionText}>{scanStatus}</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.isBNPCEligible && !item.excludedFromDiscount && (
          <View style={styles.bnpcBadge}>
            <MaterialIcons name="discount" size={12} color="#FFFFFF" />
            <Text style={styles.bnpcBadgeText}>BNPC</Text>
          </View>
        )}
        {item.excludedFromDiscount && (
          <View style={styles.noDiscountBadge}>
            <MaterialIcons name="block" size={12} color="#FFFFFF" />
            <Text style={styles.noDiscountBadgeText}>No Disc.</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveItem(index)}
        >
          <MaterialIcons name="close" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>SKU:</Text>
          <Text style={styles.detailValue}>{item.sku}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Barcode:</Text>
          <Text style={styles.detailValue}>{item.barcode}</Text>
        </View>
        {item.bnpcCategory && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>
              {item.category?.categoryName} ({item.bnpcCategory})
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => handleUpdateQuantity(index, item.quantity - 1)}
          >
            <MaterialIcons name="remove" size={20} color="#374151" />
          </TouchableOpacity>

          <View style={styles.qtyDisplay}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <Text style={styles.unitText}>{item.unit}</Text>
            {item.stockQuantity && (
              <Text style={styles.stockText}>Stock: {item.stockQuantity}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => handleUpdateQuantity(index, item.quantity + 1)}
          >
            <MaterialIcons name="add" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price:</Text>
            <Text style={styles.priceValue}>₱{item.price.toFixed(2)}</Text>
          </View>
          {item.srp && item.srp !== item.price && (
            <View style={styles.priceRow}>
              <Text style={styles.srpLabel}>SRP:</Text>
              <Text style={styles.srpValue}>₱{item.srp.toFixed(2)}</Text>
            </View>
          )}
          <Text style={styles.subtotalValue}>₱{item.subtotal.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Barcode Scanning</Text>
          <Text style={styles.headerSubtitle}>
            {isScanning
              ? "Ready to scan"
              : loading
                ? "Processing..."
                : "Item added"}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setManualBarcodeVisible(true)}
          >
            <MaterialIcons name="keyboard" size={24} color="#374151" />
          </TouchableOpacity>

          <View style={styles.userStatus}>
            {(isSenior || isPWD) && (
              <View style={styles.eligibleBadge}>
                <MaterialIcons
                  name={isSenior ? "elderly" : "accessible"}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.eligibleText}>
                  {isSenior ? "Senior" : "PWD"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Camera Section & Items / Payment */}
      {stage === "scan" ? (
        <>
          {/* Camera Section */}
          {!permission
            ? renderLoadingView()
            : !permission.granted
              ? renderPermissionView()
              : renderCameraView()}

          {/* Scanned Items Section */}
          <View style={styles.listContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                Scanned Items ({scannedItems.length})
              </Text>
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>₱{totalPrice.toFixed(2)}</Text>
              </View>
            </View>

            {/* BNPC Summary if eligible */}
            {(isSenior || isPWD) && (
              <View style={styles.bnpcSummary}>
                <Text style={styles.bnpcSummaryText}>
                  BNPC Eligible Items: ₱
                  {scannedItems
                    .filter(
                      (item) =>
                        item.isBNPCEligible && !item.excludedFromDiscount,
                    )
                    .reduce((sum, item) => sum + item.subtotal, 0)
                    .toFixed(2)}
                </Text>
              </View>
            )}

            {scannedItems.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="receipt-long" size={48} color="#E2E8F0" />
                <Text style={styles.emptyStateText}>
                  Scan items to appear here
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Position barcode within the camera frame
                </Text>
              </View>
            ) : (
              <FlatList
                data={scannedItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.barcode}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={() => {
                  if (scannedItems.length > 0) {
                    Alert.alert(
                      "Clear All Items",
                      "Are you sure you want to clear all scanned items?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Clear",
                          style: "destructive",
                          onPress: () => setScannedItems([]),
                        },
                      ],
                    );
                  }
                }}
                disabled={scannedItems.length === 0}
              >
                <MaterialIcons name="clear-all" size={20} color="#64748B" />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.paymentButton,
                  scannedItems.length === 0 && styles.disabledButton,
                ]}
                onPress={handleProceedToPayment}
                disabled={scannedItems.length === 0}
              >
                <MaterialIcons name="payment" size={20} color="#FFFFFF" />
                <Text style={styles.paymentButtonText}>
                  Proceed to Payment ({scannedItems.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        /* Payment Stage */
        <ScrollView
          style={styles.paymentContainer}
          contentContainerStyle={styles.paymentScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.paymentSection}>
            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Count</Text>
                <Text style={styles.summaryValue}>{scannedItems.length}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  ₱{totalPrice.toFixed(2)}
                </Text>
              </View>

              {(isSenior || isPWD) && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>BNPC Eligible</Text>
                  <Text style={styles.summaryValue}>
                    ₱
                    {scannedItems
                      .filter(
                        (item) =>
                          item.isBNPCEligible && !item.excludedFromDiscount,
                      )
                      .reduce((sum, item) => sum + item.subtotal, 0)
                      .toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Due</Text>
                <Text style={styles.totalAmount}>₱{totalPrice.toFixed(2)}</Text>
              </View>
            </View>

            {/* Customer Type Selection */}
            <View style={styles.customerTypeCard}>
              <Text style={styles.cardTitle}>Customer Type</Text>
              <View style={styles.typeOptions}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    customerType === "regular" && styles.typeOptionActive,
                  ]}
                  onPress={() => setCustomerType("regular")}
                >
                  <MaterialIcons
                    name="person"
                    size={24}
                    color={customerType === "regular" ? "#00A86B" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      customerType === "regular" && styles.typeTextActive,
                    ]}
                  >
                    Regular
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    customerType === "senior" && styles.typeOptionActive,
                  ]}
                  onPress={() => setCustomerType("senior")}
                >
                  <MaterialIcons
                    name="elderly"
                    size={24}
                    color={customerType === "senior" ? "#00A86B" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      customerType === "senior" && styles.typeTextActive,
                    ]}
                  >
                    Senior
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    customerType === "pwd" && styles.typeOptionActive,
                  ]}
                  onPress={() => setCustomerType("pwd")}
                >
                  <MaterialIcons
                    name="accessible"
                    size={24}
                    color={customerType === "pwd" ? "#00A86B" : "#94A3B8"}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      customerType === "pwd" && styles.typeTextActive,
                    ]}
                  >
                    PWD
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Discount Info */}
            {(customerType === "senior" || customerType === "pwd") && (
              <View style={styles.discountInfoCard}>
                <View style={styles.discountRow}>
                  <Text style={styles.discountLabel}>Eligible Amount:</Text>
                  <Text style={styles.discountValue}>
                    ₱
                    {scannedItems
                      .filter(
                        (item) =>
                          item.isBNPCEligible && !item.excludedFromDiscount,
                      )
                      .reduce((sum, item) => sum + item.subtotal, 0)
                      .toFixed(2)}
                  </Text>
                </View>
                <View style={styles.discountRow}>
                  <Text style={styles.discountLabel}>Discount (5%):</Text>
                  <Text style={styles.discountValue}>
                    ₱
                    {Math.min(
                      scannedItems
                        .filter(
                          (item) =>
                            item.isBNPCEligible && !item.excludedFromDiscount,
                        )
                        .reduce((sum, item) => sum + item.subtotal, 0) * 0.05,
                      125,
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Promo Code */}
            <View style={styles.promoCard}>
              <Text style={styles.cardTitle}>Promos (Optional)</Text>

              {loadingPromos ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#00A86B" />
                  <Text style={styles.loadingText}>Loading promos...</Text>
                </View>
              ) : promoCatalog.length === 0 ? (
                <View style={styles.emptyPromoContainer}>
                  <MaterialIcons name="local-offer" size={32} color="#CBD5E1" />
                  <Text style={styles.emptyPromoText}>No promos available</Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={promoCatalog}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.promoOption,
                          appliedPromo?.code === item.code &&
                            styles.promoOptionSelected,
                        ]}
                        onPress={() => {
                          if (appliedPromo?.code === item.code) {
                            // Deselect if clicking same promo
                            setAppliedPromo(null);
                          } else {
                            // Validate promo before applying
                            const evaluation = evaluatePromoLocal(item);

                            if (!evaluation.valid) {
                              Alert.alert(
                                "Promo Invalid",
                                evaluation.reason ||
                                  "This promo cannot be applied",
                              );
                              return;
                            }

                            // Select new promo with validated discount
                            setAppliedPromo({
                              code: item.code,
                              name: item.name,
                              discountAmount: evaluation.discount,
                              discountType: item.discountType || "fixed",
                              isUnlimited: item.isUnlimited,
                              validatedAt: new Date().toISOString(),
                            });
                          }
                        }}
                      >
                        <View style={styles.promoCheckbox}>
                          {appliedPromo?.code === item.code && (
                            <MaterialIcons
                              name="check-circle"
                              size={20}
                              color="#00A86B"
                            />
                          )}
                        </View>
                        <View style={styles.promoInfo}>
                          <Text style={styles.promoOptionCode}>
                            {item.code}
                          </Text>
                          <Text style={styles.promoOptionName}>
                            {item.name}
                          </Text>
                          {item.isUnlimited === true && (
                            <Text style={styles.unlimitedBadge}>Unlimited</Text>
                          )}
                        </View>
                        <Text style={styles.promoDiscount}>
                          {item.discountType === "percentage"
                            ? `${item.discountAmount || 0}%`
                            : `₱${(item.discountAmount || 0).toFixed(2)}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.code}
                  />
                </>
              )}

              {appliedPromo && (
                <View style={styles.appliedPromoBoxNew}>
                  <MaterialIcons
                    name="check-circle"
                    size={18}
                    color="#00A86B"
                  />
                  <View style={styles.appliedPromoInfoNew}>
                    <Text style={styles.appliedPromoCodeNew}>
                      {appliedPromo.code || "N/A"}
                    </Text>
                    <Text style={styles.appliedPromoNameNew}>
                      {appliedPromo.name || "Promo"}
                    </Text>
                  </View>
                  <Text style={styles.appliedPromoAmountNew}>
                    ₱{Math.max(0, appliedPromo.discountAmount || 0).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {/* Booklet Confirmation */}
            {(customerType === "senior" || customerType === "pwd") && (
              <View style={styles.bookletCard}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setBookletConfirmed(!bookletConfirmed)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      bookletConfirmed && styles.checkboxChecked,
                    ]}
                  >
                    {bookletConfirmed && (
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I have updated the customer's booklet
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Button Group */}
            <View style={styles.paymentButtonGroup}>
              <TouchableOpacity
                style={[styles.backButton, styles.paymentBackButton]}
                onPress={() => {
                  setStage("scan");
                  setCustomerType("regular");
                  setPromoCode("");
                  setAppliedPromo(null);
                  setBookletConfirmed(false);
                }}
                disabled={paymentLoading}
              >
                <MaterialIcons name="arrow-back" size={20} color="#374151" />
                <Text style={styles.backButtonText}>Back to Scan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.completeButton,
                  paymentLoading && styles.disabledButton,
                ]}
                onPress={handleCompletePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <>
                    <ActivityIndicator
                      color="#FFFFFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.completeButtonText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.completeButtonText}>Confirm Order</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

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
                <MaterialIcons name="close" size={28} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <View style={styles.manualInputContainer}>
              <MaterialIcons
                name="qr-code-scanner"
                size={40}
                color="#1D4ED8"
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
                  <Text style={styles.submitButtonText}>Add Item</Text>
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
            { transform: [{ translateY: toastPosition }] },
          ]}
        >
          <View style={styles.toastContent}>
            <View style={styles.toastMessage}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#00A86B"
              />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
            {lastAddedItem && (
              <TouchableOpacity
                style={styles.undoButton}
                onPress={handleUndoAddItem}
              >
                <Text style={styles.undoButtonText}>UNDO</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  userStatus: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  eligibleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A86B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  eligibleText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  permissionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A86B",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    width: "100%",
    justifyContent: "center",
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  loadingText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  scannerFrame: {
    width: 280,
    height: 160,
    position: "relative",
    marginTop: 40,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#00A86B",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderBottomRightRadius: 8,
  },
  progressContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  progressCircle: {
    width: 50,
    height: 50,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  progressBackground: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  progressFill: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "#00A86B",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  progressInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  instructionBox: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  processingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  listContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: height * 0.45,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  totalSection: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  bnpcSummary: {
    backgroundColor: "#F0FDF4",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  bnpcSummaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
    textAlign: "center",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  bnpcBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A86B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
    marginRight: 8,
    alignSelf: "flex-start",
  },
  bnpcBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  noDiscountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
    marginRight: 8,
    alignSelf: "flex-start",
  },
  noDiscountBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
  },
  itemDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    width: 70,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 4,
  },
  qtyButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qtyDisplay: {
    alignItems: "center",
    paddingHorizontal: 16,
    minWidth: 60,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  unitText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
  },
  stockText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  priceSection: {
    alignItems: "flex-end",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginRight: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  srpLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
    marginRight: 4,
  },
  srpValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  actionBar: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  clearButton: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  clearButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  paymentButton: {
    backgroundColor: "#00A86B",
  },
  disabledButton: {
    backgroundColor: "#E2E8F0",
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  manualButton: {
    padding: 8,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toastContainer: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#1D4ED8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toastMessage: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(29, 78, 216, 0.2)",
    borderRadius: 8,
    marginLeft: 8,
  },
  undoButtonText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Payment Screen Styles
  paymentContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  paymentScrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  paymentSection: {
    width: "100%",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#00A86B",
  },
  paymentMethodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },
  customerTypeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  typeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  typeOptionActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#00A86B",
  },
  typeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 8,
  },
  typeTextActive: {
    color: "#00A86B",
  },
  methodOptions: {
    flexDirection: "row",
    gap: 12,
  },
  methodOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  methodOptionActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#00A86B",
  },
  methodText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 6,
  },
  methodTextActive: {
    color: "#00A86B",
  },
  // Discount Info Styles
  discountInfoCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  discountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  // Promo Code Styles
  promoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 12,
    fontWeight: "500",
  },
  emptyPromoContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyPromoText: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 12,
    fontWeight: "500",
  },
  promoOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    gap: 12,
  },
  promoOptionSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#A7F3D0",
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  promoCheckbox: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  promoInfo: {
    flex: 1,
  },
  promoOptionCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  promoOptionName: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  unlimitedBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#00A86B",
    marginTop: 6,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  promoDiscount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#00A86B",
  },
  appliedPromoBoxNew: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: "#BBF7D0",
    marginTop: 14,
    gap: 12,
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appliedPromoInfoNew: {
    flex: 1,
  },
  appliedPromoCodeNew: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  appliedPromoNameNew: {
    fontSize: 13,
    color: "#047857",
    marginTop: 4,
  },
  appliedPromoAmountNew: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00A86B",
  },
  cashPaymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginRight: 4,
  },
  cashInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  changeDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  changeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  changeAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  insufficientWarning: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FED7AA",
    gap: 10,
  },
  warningText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9A3412",
  },
  paymentButtonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  paymentBackButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  completeButton: {
    flex: 1,
    backgroundColor: "#00A86B",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  // Customer Type Styles
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },
  customerTypeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  typeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  typeOptionActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#00A86B",
  },
  typeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 8,
  },
  typeTextActive: {
    color: "#00A86B",
  },
  // Discount Info Styles
  discountInfoCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  discountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  // Promo Code Styles
  promoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  promoInputGroup: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  promoInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#111827",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 12,
    fontWeight: "500",
  },
  emptyPromoContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyPromoText: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 12,
    fontWeight: "500",
  },
  promoOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    gap: 12,
  },
  promoOptionSelected: {
    backgroundColor: "#F0FDF4",
    borderColor: "#A7F3D0",
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  promoCheckbox: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  promoInfo: {
    flex: 1,
  },
  promoOptionCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  promoOptionName: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  unlimitedBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#00A86B",
    marginTop: 6,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  promoDiscount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#00A86B",
  },
  appliedPromoBoxNew: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: "#BBF7D0",
    marginTop: 14,
    gap: 12,
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appliedPromoInfoNew: {
    flex: 1,
  },
  appliedPromoCodeNew: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  appliedPromoNameNew: {
    fontSize: 13,
    color: "#047857",
    marginTop: 4,
  },
  appliedPromoAmountNew: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00A86B",
  },
  applyPromoButton: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  applyPromoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  appliedPromoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 8,
  },
  appliedPromoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00A86B",
  },
  // Booklet Confirmation Styles
  bookletCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#00A86B",
    borderColor: "#00A86B",
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  paymentButtonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  paymentBackButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  completeButton: {
    flex: 1,
    backgroundColor: "#00A86B",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
});

export default BarcodeScanningScreen;
