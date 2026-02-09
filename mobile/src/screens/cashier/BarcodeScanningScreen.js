import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { scanProduct } from "../../api/product.api";
import { useDispatch } from "react-redux";
import { clearCart } from "../../features/slices/cart/cartSlice";

const { width, height } = Dimensions.get('window');

const BarcodeScanningScreen = ({ navigation, route }) => {
  const [scannedItems, setScannedItems] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const isProcessingRef = useRef(false);
  const cameraRef = useRef(null);

  const dispatch = useDispatch();

  // Get user eligibility from route params if coming from TransactionScreen
  const userEligibility = route.params?.userEligibility || {};
  const { isSenior = false, isPWD = false } = userEligibility;

  // Calculate total price when scanned items change
  useEffect(() => {
    const total = scannedItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    setTotalPrice(total);
  }, [scannedItems]);

  const handleScan = async ({ data, type }) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsScanning(false);
    setLoading(true);

    try {
      console.log(`Scanning barcode: ${data} (${type})`);
      
      // Check if item already exists in scanned items
      const existingItemIndex = scannedItems.findIndex(
        item => item.barcode === data
      );

      if (existingItemIndex > -1) {
        // Item already exists, increment quantity
        const updatedItems = [...scannedItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
          subtotal: updatedItems[existingItemIndex].price * (updatedItems[existingItemIndex].quantity + 1)
        };
        setScannedItems(updatedItems);
        
        // Show success feedback
        Alert.alert(
          "Item Updated",
          `Quantity increased to ${updatedItems[existingItemIndex].quantity}`,
          [{ text: "OK" }]
        );
      } else {
        // New item, fetch from API
        const response = await scanProduct(data, type);
        
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
            images: response.images || []
          };
          
          setScannedItems(prev => [...prev, newItem]);
          
          // Show success feedback
          Alert.alert(
            "Product Scanned",
            `Added: ${response.name}`,
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Product Not Found",
            `No product found for barcode: ${data}`,
            [{ text: "OK", onPress: () => setIsScanning(true) }]
          );
        }
      }
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert(
        "Scan Error",
        "Failed to scan product. Please try again.",
        [{ text: "OK", onPress: () => setIsScanning(true) }]
      );
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
        setLoading(false);
        setIsScanning(true);
      }, 1000);
    }
  };

  const handleProceedToPayment = () => {
    if (scannedItems.length === 0) {
      Alert.alert(
        "No Items Scanned",
        "Please scan at least one item before proceeding to payment."
      );
      return;
    }

    // Calculate BNPC eligible subtotal
    const bnpcSubtotal = scannedItems
      .filter(item => item.isBNPCEligible && !item.excludedFromDiscount)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate regular subtotal (non-BNPC items)
    const regularSubtotal = scannedItems
      .filter(item => !item.isBNPCEligible || item.excludedFromDiscount)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Transform scanned items to match PaymentScreen expected format
    const checkoutItems = scannedItems.map(item => ({
      productId: item.id,
      name: item.name,
      unitPrice: item.price,
      srp: item.srp,
      quantity: item.quantity,
      totalPrice: item.subtotal,
      isBNPCEligible: item.isBNPCEligible && !item.excludedFromDiscount,
      bnpcCategory: item.bnpcCategory,
      category: item.category,
      sku: item.sku,
      barcode: item.barcode,
      unit: item.unit,
      excludedFromDiscount: item.excludedFromDiscount,
      stockQuantity: item.stockQuantity
    }));

    // Create checkout data object matching PaymentScreen structure
    const checkoutData = {
      _id: `temp_${Date.now()}`, // Temporary ID for the transaction
      items: checkoutItems,
      totals: {
        subtotal: totalPrice,
        bnpcSubtotal: bnpcSubtotal,
        regularSubtotal: regularSubtotal,
        discount: 0, // Will be calculated in PaymentScreen
        finalTotal: totalPrice
      },
      userEligibility: {
        isSenior: isSenior || false,
        isPWD: isPWD || false,
        verified: isSenior || isPWD // Mark as verified if eligible
      },
      discountSnapshot: {
        eligible: isSenior || isPWD,
        bnpcSubtotal: bnpcSubtotal,
        weeklyDiscountUsed: 0, // Start from 0, will be input in PaymentScreen
        weeklyPurchaseUsed: 0, // Start from 0
        remainingDiscountCap: 125, // ₱125 weekly cap
        remainingPurchaseCap: 2500, // ₱2,500 weekly purchase cap
        maxPossibleDiscount: Math.min(125, 2500, bnpcSubtotal * 0.05) // 5% of eligible items, capped
      },
      voucher: null, // No voucher applied yet
      cashier: {
        // Add current user/cashier info if available
        id: "current_cashier_id",
        name: "Cashier",
        _id: "current_cashier_id"
      },
      status: "pending",
      paymentMethod: "cash", // Default to cash
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Generate a checkout code (in real app, this would come from API)
    const checkoutCode = `CHK-${Date.now().toString().slice(-8)}`;

    // Clear Redux cart if needed (optional)
    dispatch(clearCart());

    // Navigate to PaymentScreen with all required data
    navigation.navigate("Payment", {
      checkoutData,
      checkoutCode,
      scannedItemsCount: scannedItems.length,
      totalAmount: totalPrice,
      bnpcEligibleTotal: bnpcSubtotal,
      appUser:false
    });
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
        [{ text: "OK" }]
      );
      return;
    }
    
    const updatedItems = [...scannedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity,
      subtotal: updatedItems[index].price * newQuantity
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
        onBarcodeScanned={isScanning ? handleScan : undefined}
      />
      
      {/* Scanner Overlay */}
      <View style={styles.scannerOverlay}>
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          
          <View style={styles.scanLine} />
        </View>
        
        <View style={styles.instructionBox}>
          <MaterialIcons name="qr-code-scanner" size={20} color="#FFFFFF" />
          <Text style={styles.instructionText}>
            Position barcode within frame
          </Text>
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
              <Text style={styles.stockText}>
                Stock: {item.stockQuantity}
              </Text>
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
            {isScanning ? "Ready to scan" : loading ? "Processing..." : "Item added"}
          </Text>
        </View>
        
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

      {/* Camera Section */}
      {!permission ? (
        renderLoadingView()
      ) : !permission.granted ? (
        renderPermissionView()
      ) : (
        renderCameraView()
      )}

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
              BNPC Eligible Items: ₱{
                scannedItems
                  .filter(item => item.isBNPCEligible && !item.excludedFromDiscount)
                  .reduce((sum, item) => sum + item.subtotal, 0)
                  .toFixed(2)
              }
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
                      onPress: () => setScannedItems([]) 
                    }
                  ]
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
              scannedItems.length === 0 && styles.disabledButton
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
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: "#00A86B",
    borderRadius: 1,
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
});

export default BarcodeScanningScreen;