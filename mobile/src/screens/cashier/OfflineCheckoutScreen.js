import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BarcodeScanner from "../../components/BarcodeScanner";
import { useFocusEffect } from "@react-navigation/native";
import { getPromos } from "../../api/promo.api";
import {
  fetchCatalogFromServer,
  loadCatalogFromStorage,
} from "../../features/slices/product/productThunks";
import { readPromos, writePromos } from "../../utils/promoStorage";

const { width } = Dimensions.get("window");

export default function OfflineCheckoutScreen({ route, navigation }) {
  const [stage, setStage] = useState("qr"); // qr | scan | discount
  const [customerCart, setCustomerCart] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [itemScanProgress, setItemScanProgress] = useState(0);
  const [eligibilityType, setEligibilityType] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoCatalog, setPromoCatalog] = useState([]);
  const [allItemsMatched, setAllItemsMatched] = useState(false);
  const [qrError, setQrError] = useState("");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  // Scan consistency verification
  const scanBufferRef = useRef([]);
  const itemScanBufferRef = useRef([]);
  const CONSISTENCY_THRESHOLD = 5; // Number of identical scans needed
  const SCAN_TIMEOUT_MS = 1000; // Clear scans older than this
  const resetTimeoutRef = useRef(null);
  const itemResetTimeoutRef = useRef(null);

  const dispatch = useDispatch();
  const userState = useSelector((state) => state.auth);
  const networkState = useSelector((state) => state.network);
  const catalogProducts = useSelector((state) => state.product?.products || []);
  const isOnline = !networkState?.isOffline && !networkState?.isServerDown;
  const [localIsOnline, setLocalIsOnline] = useState(isOnline);

  // Monitor network state
  useEffect(() => {
    if (isOnline && !localIsOnline) {
      Alert.alert(
        "Connection Restored",
        "Network is back. Continue completing transaction locally and it will sync when done.",
      );
    }
    setLocalIsOnline(isOnline);
  }, [isOnline]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      if (itemResetTimeoutRef.current) {
        clearTimeout(itemResetTimeoutRef.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      if (!catalogProducts.length) {
        dispatch(loadCatalogFromStorage());
      }
      if (isOnline) {
        dispatch(fetchCatalogFromServer());
      }

      const syncPromos = async () => {
        try {
          const localPromos = await readPromos();
          // console.log("Local promos:", localPromos);
          if (isActive && localPromos.length) {
            setPromoCatalog(localPromos);
          }

          if (isOnline) {
            const serverPromos = await getPromos();
            const unlimitedPromos = serverPromos.filter((promo) => {
              const limit = Number(promo.usageLimit || 0);
              return limit <= 0 && promo.active !== false;
            });
            if (isActive) {
              setPromoCatalog(unlimitedPromos);
            }
            await writePromos(unlimitedPromos);
          }
        } catch (error) {}
      };

      syncPromos();

      return () => {
        isActive = false;
      };
    }, [catalogProducts.length, dispatch, isOnline]),
  );

  const getProductByBarcode = useCallback(
    (barcode) =>
      catalogProducts.find(
        (product) => String(product.barcode) === String(barcode),
      ),
    [catalogProducts],
  );

  const getProductById = useCallback(
    (productId) =>
      catalogProducts.find(
        (product) => String(product._id) === String(productId),
      ),
    [catalogProducts],
  );

  const getEffectivePrice = useCallback((product) => {
    if (!product) return 0;
    if (product.saleActive && Number(product.salePrice) > 0) {
      return Number(product.salePrice);
    }
    return Number(product.price || 0);
  }, []);

  const buildCartContext = useCallback(
    (items) => {
      let subtotal = 0;
      const products = [];
      const categories = [];
      const cartItems = [];

      items.forEach((item) => {
        const product = getProductById(item.productId);
        if (!product) return;
        const qty = Number(item.quantity || 0);
        const price = getEffectivePrice(product);
        subtotal += price * qty;
        products.push(String(product._id));
        if (product.category?._id) {
          categories.push(String(product.category._id));
        }
        cartItems.push({ product, qty, unitPrice: price });
      });

      return {
        subtotal,
        products,
        categories,
        items: cartItems,
      };
    },
    [getProductById],
  );

  const evaluatePromoLocal = useCallback((cartContext, promo) => {
    const now = new Date();
    if (!promo || promo.active === false) {
      return { valid: false, reason: "Promo not active" };
    }

    if (promo.startDate && now < new Date(promo.startDate)) {
      return { valid: false, reason: "Promo expired" };
    }

    if (promo.endDate && now > new Date(promo.endDate)) {
      return { valid: false, reason: "Promo expired" };
    }

    if (promo.minPurchase && cartContext.subtotal < promo.minPurchase) {
      return { valid: false, reason: "Minimum purchase not met" };
    }

    const targetIds = (promo.targetIds || []).map((id) => String(id));
    const cartMatchesPromo = (() => {
      switch (promo.scope) {
        case "cart":
          return true;
        case "product":
          return cartContext.products.some((id) => targetIds.includes(id));
        case "category":
          return cartContext.categories.some((id) => targetIds.includes(id));
        default:
          return false;
      }
    })();

    if (!cartMatchesPromo) {
      return { valid: false, reason: "Promo not applicable" };
    }

    let baseAmount = cartContext.subtotal;

    if (promo.scope === "product") {
      baseAmount = cartContext.items
        .filter((i) => targetIds.includes(String(i.product._id)))
        .reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
    }

    if (promo.scope === "category") {
      baseAmount = cartContext.items
        .filter((i) => targetIds.includes(String(i.product.category?._id)))
        .reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
    }

    const promoType = promo.promoType || promo.type;
    const discount =
      promoType === "percentage"
        ? baseAmount * (Number(promo.value || 0) / 100)
        : Math.min(Number(promo.value || 0), baseAmount);

    return {
      valid: true,
      promo,
      discount,
    };
  }, []);

  // STAGE 1: Scan Customer QR Code (with consistency checking)
  const handleQRScanned = useCallback((_, qrData) => {
    const now = Date.now();

    // Add current scan to buffer
    scanBufferRef.current.push({
      data: qrData,
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
      scanBufferRef.current = [];
      setScanProgress(0);
    }, 1500);

    // Check if all recent scans are identical
    if (recentScans.length < CONSISTENCY_THRESHOLD) {
      return; // Not enough consistent scans yet
    }

    const allMatch = recentScans.every((scan) => scan.data === qrData);
    if (!allMatch) {
      return; // Scans don't match, keep waiting
    }

    // Clear buffer after successful scan
    scanBufferRef.current = [];
    setScanProgress(0);
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Process the QR code
    try {
      // Parse QR data - expecting JSON with cart info
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        // If not JSON, treat as checkout code
        parsedData = { checkoutCode: qrData };
      }

      const { cartSnapshot, user, checkoutCode, totals } = parsedData;

      if (
        !cartSnapshot ||
        !cartSnapshot.items ||
        cartSnapshot.items.length === 0
      ) {
        setQrError("Invalid QR: No cart items found");
        Alert.alert("Invalid QR Code", "Cart data not found in QR code");
        return;
      }

      // Set customer cart and move to scan stage
      setCustomerCart({
        checkoutCode: checkoutCode || `CHK-${Date.now()}`,
        items: cartSnapshot.items,
        user,
        totals: totals || { subtotal: 0, finalTotal: 0 },
      });

      setQrError("");
      setStage("scan");
    } catch (error) {
      console.error("❌ [OFFLINE CHECKOUT] QR parse error:", error);
      setQrError("Failed to parse QR data");
      Alert.alert("Invalid QR", "Unable to read this QR code");
    }
  }, []);

  // STAGE 2: Scan Items and Validate Against Customer Cart (with consistency checking)
  const handleItemBarcodeScanned = useCallback(
    (_, barcode) => {
      if (!customerCart) {
        console.log("Customer cart not loaded");
        return;
      }

      const now = Date.now();

      itemScanBufferRef.current.push({
        barcode: barcode,
        timestamp: now,
      });

      // Remove old scans outside the time window
      itemScanBufferRef.current = itemScanBufferRef.current.filter(
        (scan) => now - scan.timestamp < SCAN_TIMEOUT_MS,
      );

      // Get the last N scans
      const recentScans = itemScanBufferRef.current.slice(
        -CONSISTENCY_THRESHOLD,
      );

      // Calculate progress percentage
      const progress = (recentScans.length / CONSISTENCY_THRESHOLD) * 100;
      setItemScanProgress(progress);

      // Auto-reset: Clear progress if no new scans for 1.5 seconds
      if (itemResetTimeoutRef.current) {
        clearTimeout(itemResetTimeoutRef.current);
      }
      itemResetTimeoutRef.current = setTimeout(() => {
        itemScanBufferRef.current = [];
        setItemScanProgress(0);
      }, 1500);

      // Check if all recent scans are identical
      if (recentScans.length < CONSISTENCY_THRESHOLD) {
        return; // Not enough consistent scans yet
      }

      const allMatch = recentScans.every((scan) => scan.barcode === barcode);
      if (!allMatch) {
        return; // Scans don't match, keep waiting
      }

      // Clear buffer after successful scan
      itemScanBufferRef.current = [];
      setItemScanProgress(0);
      if (itemResetTimeoutRef.current) {
        clearTimeout(itemResetTimeoutRef.current);
      }

      const matchedProduct = getProductByBarcode(barcode);
      if (!matchedProduct) {
        Alert.alert(
          "Product Not Found",
          "This barcode is not in the local product catalog.",
        );
        return;
      }

      // Find matching item in customer's cart
      const matchingCartItem = customerCart.items.find(
        (item) => String(item.productId) === String(matchedProduct._id),
      );

      if (!matchingCartItem) {
        setPendingProduct(matchedProduct);
        setShowAddItemModal(true);
        return;
      }

      // Check if already scanned
      const existingScanned = scannedItems.find(
        (item) => String(item.productId) === String(matchedProduct._id),
      );

      let updatedScanned;
      if (existingScanned) {
        // Increment quantity
        if (existingScanned.scannedQty < matchingCartItem.quantity) {
          updatedScanned = scannedItems.map((item) =>
            String(item.productId) === String(matchedProduct._id)
              ? { ...item, scannedQty: item.scannedQty + 1 }
              : item,
          );
        } else {
          Alert.alert(
            "Enough Scanned",
            `All ${matchingCartItem.quantity} units of this item already scanned`,
          );
          return;
        }
      } else {
        // New item
        updatedScanned = [
          ...scannedItems,
          {
            productId: matchedProduct._id,
            quantity: matchingCartItem.quantity,
            scannedQty: 1,
          },
        ];
      }

      setScannedItems(updatedScanned);
      updateProgress(updatedScanned);
      checkAllMatched(updatedScanned);
    },
    [customerCart, scannedItems, getProductByBarcode],
  );

  const updateProgress = (currentScanned, cartItems = customerCart?.items) => {
    if (!cartItems) return;
    const totalScanned = currentScanned.reduce(
      (sum, item) => sum + item.scannedQty,
      0,
    );
    const totalRequired = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const progress =
      totalRequired > 0 ? (totalScanned / totalRequired) * 100 : 0;
    setScanProgress(progress);
  };

  const checkAllMatched = (currentScanned, cartItems = customerCart?.items) => {
    if (!cartItems) return;
    const allMatched = cartItems.every((cartItem) => {
      const scanned = currentScanned.find(
        (s) => s.productId === cartItem.productId,
      );
      return scanned && scanned.scannedQty === cartItem.quantity;
    });
    setAllItemsMatched(allMatched);
  };

  const handleAddMissingItem = () => {
    if (!pendingProduct || !customerCart) return;

    const updatedCartItems = [
      ...customerCart.items,
      {
        productId: pendingProduct._id,
        quantity: 1,
        price: pendingProduct.price || 0,
        name: pendingProduct.name || "Unknown",
        barcode: pendingProduct.barcode || null,
      },
    ];

    const updatedScanned = [
      ...scannedItems,
      {
        productId: pendingProduct._id,
        quantity: 1,
        scannedQty: 1,
      },
    ];

    setCustomerCart((prev) => ({
      ...prev,
      items: updatedCartItems,
    }));
    setScannedItems(updatedScanned);
    updateProgress(updatedScanned, updatedCartItems);
    checkAllMatched(updatedScanned, updatedCartItems);

    setPendingProduct(null);
    setShowAddItemModal(false);
  };

  const handleSkipMissingItem = () => {
    setPendingProduct(null);
    setShowAddItemModal(false);
  };

  const applyPromoSelection = useCallback(
    (promo, fallbackCode = "") => {
      if (!customerCart) {
        Alert.alert("Invalid Promo", "Scan a cart before applying a promo");
        return;
      }

      if (!promo) {
        Alert.alert("Invalid Promo", "Promo code not found offline");
        return;
      }

      const pricingItems = (
        scannedItems.length ? scannedItems : customerCart?.items || []
      ).map((item) => ({
        productId: item.productId,
        quantity: item.scannedQty ?? item.quantity ?? 0,
      }));

      const cartContext = buildCartContext(pricingItems);
      const result = evaluatePromoLocal(cartContext, promo);

      if (!result.valid) {
        Alert.alert("Invalid Promo", result.reason || "Promo not applicable");
        return;
      }

      setAppliedPromo({
        promo: result.promo,
        discount: result.discount,
        appliedAt: new Date().toISOString(),
      });
      setPromoCode(fallbackCode || result.promo?.code || "");

      Alert.alert(
        "Success",
        `Promo ${result.promo?.code} applied! You'll save ₱${result.discount.toFixed(2)}`,
      );
    },
    [buildCartContext, customerCart, evaluatePromoLocal, scannedItems],
  );

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      Alert.alert("Invalid Promo", "Please enter a promo code");
      return;
    }

    const normalizedCode = promoCode.trim().toLowerCase();
    const matchedPromo = promoCatalog.find(
      (promo) => promo.code?.toLowerCase() === normalizedCode,
    );

    applyPromoSelection(matchedPromo, promoCode.trim());
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  const totals = useMemo(() => {
    if (!customerCart) {
      return {
        subtotal: 0,
        eligibilityDiscount: 0,
        promoDiscount: 0,
        finalTotal: 0,
        promo: null,
      };
    }

    const pricingItems = (
      scannedItems.length ? scannedItems : customerCart.items
    ).map((item) => ({
      productId: item.productId,
      quantity: item.scannedQty ?? item.quantity ?? 0,
    }));

    const cartContext = buildCartContext(pricingItems);
    const eligibilityDiscount =
      eligibilityType && eligibilityType !== "none"
        ? cartContext.subtotal * 0.05
        : 0;

    let promoResult = null;
    if (appliedPromo?.promo) {
      promoResult = evaluatePromoLocal(cartContext, appliedPromo.promo);
    }

    const promoDiscount = promoResult?.valid ? promoResult.discount : 0;
    const finalTotal = Math.max(
      0,
      cartContext.subtotal - eligibilityDiscount - promoDiscount,
    );

    return {
      subtotal: cartContext.subtotal,
      eligibilityDiscount,
      promoDiscount,
      finalTotal,
      promo: promoResult?.valid ? promoResult.promo : null,
    };
  }, [
    appliedPromo,
    buildCartContext,
    customerCart,
    evaluatePromoLocal,
    eligibilityType,
    scannedItems,
  ]);

  const handleCompleteCheckout = async () => {
    if (!customerCart) {
      Alert.alert("Error", "Customer cart data missing");
      return;
    }

    try {
      // Calculate discount
      const subtotal = totals.subtotal || 0;
      const eligibilityDiscount = totals.eligibilityDiscount || 0;
      const promoDiscount = totals.promoDiscount || 0;

      // Create offline transaction
      const customerType =
        eligibilityType && eligibilityType !== "none"
          ? eligibilityType
          : "regular";
      const customerScope =
        eligibilityType === "senior"
          ? "SENIOR"
          : eligibilityType === "pwd"
            ? "PWD"
            : null;

      const transaction = {
        id: `offline-${Date.now()}`,
        checkoutCode: customerCart.checkoutCode,
        customerData: customerCart.user || {},
        customerType,
        customerScope,
        verificationSource:
          eligibilityType && eligibilityType !== "none" ? "manual" : "none",
        systemVerified: false,
        manualOverride: eligibilityType && eligibilityType !== "none",
        bookletUpdated: eligibilityType && eligibilityType !== "none",
        items: scannedItems.map((item) => {
          const cartItem = customerCart.items.find(
            (c) => c.productId === item.productId,
          );
          const product = getProductById(item.productId);
          const unitPrice =
            getEffectivePrice(product) ??
            cartItem?.price ??
            product?.price ??
            0;
          return {
            product: item.productId,
            name: product?.name || cartItem?.name || "Unknown",
            sku: product?.sku,
            quantity: item.scannedQty,
            unitPrice,
            salePrice: product?.salePrice,
            saleActive: product?.saleActive || false,
            category: product?.category
              ? {
                  id: product.category._id,
                  name: product.category.categoryName,
                  isBNPC: product.category.isBNPC || false,
                }
              : undefined,
            unit: product?.unit || "pc",
            itemTotal: unitPrice * item.scannedQty,
          };
        }),
        eligibility: eligibilityType === "none" ? null : eligibilityType,
        eligibilityDiscount:
          eligibilityType === "none" ? 0 : eligibilityDiscount,
        promo: totals.promo
          ? {
              promoId: totals.promo._id,
              code: totals.promo.code,
              name: totals.promo.promoName?.promo || totals.promo.name,
              type: totals.promo.promoType || totals.promo.type,
              value: totals.promo.value,
              scope: totals.promo.scope,
              targetIds: totals.promo.targetIds,
              minPurchase: totals.promo.minPurchase || 0,
              discountAmount: promoDiscount,
              serverValidated: false,
            }
          : null,
        totals: {
          subtotal: subtotal,
          eligibilityDiscount:
            eligibilityType === "none" ? 0 : eligibilityDiscount,
          promoDiscount: promoDiscount,
          finalTotal: subtotal - eligibilityDiscount - promoDiscount,
        },
        baseAmount: subtotal,
        finalAmountPaid: subtotal - eligibilityDiscount - promoDiscount,
        promoDiscount: totals.promo
          ? {
              code: totals.promo.code,
              amount: promoDiscount,
              serverValidated: false,
            }
          : { code: null, amount: 0, serverValidated: false },
        discountBreakdown: {
          bnpc: eligibilityDiscount,
          promo: promoDiscount,
          loyalty: 0,
          voucher: 0,
          total: eligibilityDiscount + promoDiscount,
        },
        cashier: {
          userId: userState.user?.userId,
          name: userState.user?.name,
        },
        timestamp: new Date().toISOString(),
        status: "CONFIRMED",
        localStatus: "pending_sync",
      };

      // Save to AsyncStorage
      const existingTransactions = await AsyncStorage.getItem(
        "offline_transactions",
      );
      const transactions = existingTransactions
        ? JSON.parse(existingTransactions)
        : [];
      transactions.push(transaction);
      await AsyncStorage.setItem(
        "offline_transactions",
        JSON.stringify(transactions),
      );

      console.log(
        "Success",
        "Transaction saved locally. Will sync when online.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("DrawTabs", { screen: "Home" });
            },
          },
        ],
      );
    } catch (error) {
      console.error("❌ [OFFLINE CHECKOUT] Error saving transaction:", error);
      Alert.alert("Error", "Failed to save transaction");
    }
  };

  // RENDER: QR Scan Stage
  const renderQRStage = () => (
    <View style={styles.stageContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Customer QR Code</Text>
        <Text style={styles.subtitle}>
          Show customer to scan their checkout QR
        </Text>
      </View>

      <View style={styles.scannerContainer}>
        <BarcodeScanner
          onDetect={handleQRScanned}
          barcodeTypes={["qrcode"]}
          scanProgress={scanProgress}
        />
      </View>

      {qrError && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color="#DC2626"
          />
          <Text style={styles.errorText}>{qrError}</Text>
        </View>
      )}

      <View style={styles.instructionBox}>
        <MaterialCommunityIcons name="information" size={20} color="#3B82F6" />
        <Text style={styles.instructionText}>
          Scan the customer's checkout QR code to load their cart items
        </Text>
      </View>
    </View>
  );

  // RENDER: Item Scan & Validation Stage
  const renderScanStage = () => (
    <View style={styles.stageContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Customer Items</Text>
        <Text style={styles.subtitle}>
          Required: {customerCart?.items.length || 0} items
        </Text>
      </View>

      <View style={styles.scannerContainer}>
        <BarcodeScanner
          onDetect={handleItemBarcodeScanned}
          scanProgress={itemScanProgress}
        />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Items Scanned</Text>
          <Text style={styles.progressCount}>
            {scannedItems.reduce((sum, item) => sum + item.scannedQty, 0)}/
            {customerCart?.items.reduce((sum, item) => sum + item.quantity, 0)}
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${scanProgress}%`,
                backgroundColor:
                  scanProgress === 100
                    ? "#00A86B"
                    : scanProgress > 50
                      ? "#FFD700"
                      : "#FFA500",
              },
            ]}
          />
        </View>

        {/* Items List */}
        <ScrollView
          style={styles.itemsList}
          showsVerticalScrollIndicator={false}
        >
          {customerCart?.items.map((cartItem) => {
            const scanned = scannedItems.find(
              (s) => s.productId === cartItem.productId,
            );
            const isComplete =
              scanned && scanned.scannedQty === cartItem.quantity;

            return (
              <View key={cartItem.productId} style={styles.itemRow}>
                <View style={styles.itemCheck}>
                  <MaterialCommunityIcons
                    name={isComplete ? "check-circle" : "circle-outline"}
                    size={20}
                    color={isComplete ? "#00A86B" : "#cbd5e1"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemId}>
                    {getProductById(cartItem.productId)?.name ||
                      cartItem.productId.slice(-6)}
                  </Text>
                  <Text style={styles.itemQtyLabel}>
                    {scanned?.scannedQty || 0} / {cartItem.quantity}
                  </Text>
                </View>
                {isComplete && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color="#00A86B"
                  />
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          !allItemsMatched && styles.buttonDisabled,
        ]}
        onPress={() => setStage("discount")}
        disabled={!allItemsMatched}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={allItemsMatched ? "#fff" : "#cbd5e1"}
        />
        <Text style={styles.buttonText}>
          {allItemsMatched ? "Next" : "Waiting for items..."}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // RENDER: Discount & Promo Stage
  const renderDiscountStage = () => (
    <View style={styles.stageContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Eligibility & Promo</Text>
        <Text style={styles.subtitle}>Apply discounts if applicable</Text>
      </View>

      {/* Eligibility */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Customer Eligibility</Text>
        <View style={styles.eligibilityGrid}>
          {[
            { id: "none", label: "Regular", icon: "account" },
            { id: "senior", label: "Senior Citizen", icon: "human-cane" },
            { id: "pwd", label: "PWD", icon: "wheelchair-accessibility" },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.eligibilityCard,
                eligibilityType === option.id && styles.eligibilitySelectedCard,
              ]}
              onPress={() => setEligibilityType(option.id)}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={24}
                color={eligibilityType === option.id ? "#00A86B" : "#64748B"}
              />
              <Text
                style={[
                  styles.eligibilityLabel,
                  eligibilityType === option.id &&
                    styles.eligibilityLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Promo Code */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Promo Code (Optional)</Text>
        <View style={styles.promoInput}>
          <TextInput
            style={styles.input}
            placeholder="Enter promo code"
            value={promoCode}
            onChangeText={setPromoCode}
            placeholderTextColor="#cbd5e1"
          />
          <TouchableOpacity
            style={styles.promoApplyBtn}
            onPress={handleApplyPromo}
            disabled={!promoCode.trim()}
          >
            <MaterialCommunityIcons
              name="check"
              size={18}
              color={promoCode.trim() ? "#fff" : "#cbd5e1"}
            />
          </TouchableOpacity>
        </View>

        {appliedPromo ? (
          <View style={styles.appliedRow}>
            <View style={styles.appliedInfo}>
              <MaterialCommunityIcons
                name="ticket-percent"
                size={18}
                color="#00A86B"
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.appliedCode}>
                  {appliedPromo.promo?.code || appliedPromo.code}
                </Text>
                <Text style={styles.appliedName}>
                  {appliedPromo.promo?.promoName?.promo ||
                    appliedPromo.promo?.name ||
                    "Promo"}
                </Text>
                <Text style={styles.appliedValue}>
                  {appliedPromo.promo?.promoType === "percentage" ||
                  appliedPromo.promo?.type === "percentage"
                    ? `${appliedPromo.promo?.value || 0}% off`
                    : `₱${appliedPromo.promo?.value || 0} off`}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeChip}
              onPress={handleRemovePromo}
            >
              <Text style={styles.removeChipText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 4 }}>
            {promoCatalog.map((promo) => (
              <TouchableOpacity
                key={promo._id || promo.code}
                style={styles.promoOption}
                onPress={() => applyPromoSelection(promo, promo.code)}
              >
                <MaterialCommunityIcons
                  name="ticket"
                  size={18}
                  color="#00A86B"
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.promoOptionCode}>{promo.code}</Text>
                  <Text style={styles.promoOptionName}>
                    {promo.promoName?.promo || promo.name || "Promo"}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Order Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items:</Text>
          <Text style={styles.summaryValue}>
            {scannedItems.reduce((sum, item) => sum + item.scannedQty, 0)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>₱{totals.subtotal.toFixed(2)}</Text>
        </View>

        {eligibilityType && eligibilityType !== "none" && (
          <View style={[styles.summaryRow, { borderBottomColor: "#FEE2E2" }]}>
            <Text style={styles.discountLabel}>
              5% {eligibilityType} Discount:
            </Text>
            <Text style={styles.discountValue}>
              -₱{totals.eligibilityDiscount.toFixed(2)}
            </Text>
          </View>
        )}

        {totals.promoDiscount > 0 && (
          <View style={[styles.summaryRow, { borderBottomColor: "#FEE2E2" }]}>
            <Text style={styles.discountLabel}>Promo Discount:</Text>
            <Text style={styles.discountValue}>
              -₱{totals.promoDiscount.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total to Pay:</Text>
          <Text style={styles.totalValue}>₱{totals.finalTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setStage("scan")}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color="#00A86B" />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleCompleteCheckout}
        >
          <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* Offline Banner */}
      <View style={styles.offlineBanner}>
        <MaterialCommunityIcons name="wifi-off" size={16} color="#fff" />
        <Text style={styles.offlineBannerText}>OFFLINE MODE</Text>
        <View style={styles.badgeDot} />
      </View>

      {/* Header with Stage Indicator */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Cancel Transaction",
              "Are you sure? This transaction will be discarded.",
              [
                { text: "Keep Going", style: "cancel" },
                {
                  text: "Cancel",
                  style: "destructive",
                  onPress: () => navigation.goBack(),
                },
              ],
            );
          }}
        >
          <MaterialCommunityIcons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>

        {/* Stage Progress */}
        <View style={styles.stageIndicator}>
          {["qr", "scan", "discount"].map((s, idx) => (
            <View key={s} style={styles.stageStep}>
              <View
                style={[
                  styles.stageDot,
                  ["qr", "scan", "discount"].indexOf(stage) >= idx
                    ? styles.stageDotActive
                    : styles.stageDotInactive,
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    ["qr", "scan", "discount"].indexOf(stage) > idx
                      ? "check"
                      : s === "qr"
                        ? "qrcode"
                        : s === "scan"
                          ? "barcode-scan"
                          : "percent"
                  }
                  size={12}
                  color="#fff"
                />
              </View>
              {idx < 2 && (
                <View
                  style={[
                    styles.stageLine,
                    ["qr", "scan", "discount"].indexOf(stage) > idx
                      ? styles.stageLineActive
                      : styles.stageLineInactive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        <View style={styles.txnBadge}>
          <MaterialCommunityIcons name="database" size={12} color="#fff" />
          <Text style={styles.txnBadgeText}>
            {customerCart?.checkoutCode?.slice(-6) || "NEW"}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {stage === "qr" && renderQRStage()}
        {stage === "scan" && renderScanStage()}
        {stage === "discount" && renderDiscountStage()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerBar}>
        <MaterialCommunityIcons
          name="database-lock"
          size={14}
          color="#FFA500"
        />
        <Text style={styles.footerText}>
          Data stored locally • Will sync when online
        </Text>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={showAddItemModal}
        onRequestClose={handleSkipMissingItem}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={28}
              color="#F59E0B"
            />
            <Text style={styles.modalTitle}>Item Not In Cart</Text>
            <Text style={styles.modalText}>
              {pendingProduct?.name || "Unknown Item"} was scanned but is not in
              the customer's cart. Add it?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={handleSkipMissingItem}
              >
                <Text style={styles.modalSecondaryText}>Do Not Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleAddMissingItem}
              >
                <Text style={styles.modalPrimaryText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  offlineBanner: {
    backgroundColor: "#DC2626",
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FCA5A5",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  stageIndicator: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  stageStep: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stageDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stageDotActive: {
    backgroundColor: "#00A86B",
  },
  stageDotInactive: {
    backgroundColor: "#cbd5e1",
  },
  stageLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  stageLineActive: {
    backgroundColor: "#00A86B",
  },
  stageLineInactive: {
    backgroundColor: "#E2E8F0",
  },
  txnBadge: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  txnBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "monospace",
  },
  footerBar: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#FCD34D",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#92400E",
  },
  stageContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  scannerContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#000",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  instructionBox: {
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  instructionText: {
    color: "#1E40AF",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  progressContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  progressCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00A86B",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  itemsList: {
    maxHeight: 200,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  itemCheck: {
    marginRight: 12,
  },
  itemId: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  itemQtyLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  sectionBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  eligibilityGrid: {
    flexDirection: "row",
    gap: 8,
  },
  eligibilityCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  eligibilitySelectedCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#00A86B",
  },
  eligibilityLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
  eligibilityLabelSelected: {
    color: "#00A86B",
  },
  promoInput: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 14,
    color: "#1E293B",
  },
  promoApplyBtn: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  appliedPromoCard: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#BBEF63",
    alignItems: "center",
    gap: 8,
  },
  appliedPromoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00A86B",
  },
  appliedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  appliedInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  appliedCode: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  appliedName: { fontSize: 12, color: "#64748B", marginTop: 2 },
  appliedValue: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  removeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  removeChipText: { fontSize: 12, fontWeight: "600", color: "#EF4444" },
  promoOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  promoOptionCode: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  promoOptionName: { fontSize: 12, color: "#64748B", marginTop: 2 },
  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  discountLabel: {
    fontSize: 13,
    color: "#DC2626",
  },
  discountValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: "#E2E8F0",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#00A86B",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#00A86B",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#00A86B",
  },
  completeButton: {
    flex: 1,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  modalText: {
    marginTop: 8,
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalPrimaryButton: {
    backgroundColor: "#00A86B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalPrimaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  modalSecondaryButton: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSecondaryText: {
    color: "#1E293B",
    fontWeight: "600",
    fontSize: 13,
  },
});
