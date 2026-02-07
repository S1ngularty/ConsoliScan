// screens/cashier/QRScanValidationScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_FRAME_SIZE = 250;
const SCAN_DELAY_MS = 1000; // 1 second delay between scans
const RESULTS_PANEL_HEIGHT = SCREEN_HEIGHT * 0.5; // Take up half the screen

const QRScanValidationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { checkoutCode, orderItems = [] } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState([]);
  const [remainingItems, setRemainingItems] = useState([...orderItems]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('back');
  const [scanComplete, setScanComplete] = useState(false);
  
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null);
  const lastScanTime = useRef(0);
  const scanTimeout = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
    };
  }, []);

  // Animation for scan line
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Check if all items are scanned
  useEffect(() => {
    if (remainingItems.length === 0 && orderItems.length > 0) {
      setScanComplete(true);
    }
  }, [remainingItems.length, orderItems.length]);

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <MaterialCommunityIcons name="camera-off" size={80} color="#64748B" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan product barcodes
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ data }) => {
    // Prevent multiple scans in quick succession
    const currentTime = Date.now();
    const timeSinceLastScan = currentTime - lastScanTime.current;
    
    if (timeSinceLastScan < SCAN_DELAY_MS || isProcessing) {
      console.log(`Scan ignored - too soon: ${timeSinceLastScan}ms since last scan`);
      return;
    }
    
    lastScanTime.current = currentTime;
    setIsProcessing(true);

    const scannedCode = data?.trim();

    if (!scannedCode) {
      setIsProcessing(false);
      return;
    }

    console.log('Scanned barcode:', scannedCode);

    // Find the item in remaining items using the barcode
    const itemIndex = remainingItems.findIndex(item => {
      // Check if the barcode matches
      const itemBarcode = item.product?.barcode;
      return itemBarcode === scannedCode;
    });

    if (itemIndex !== -1) {
      // Valid scan
      const item = remainingItems[itemIndex];
      console.log('Valid scan for item:', item.name);
      
      // Check if this SKU has already been scanned
      const existingIndex = scannedItems.findIndex(
        scanned => scanned.sku === item.sku
      );

      if (existingIndex !== -1) {
        // Update existing scanned item
        const updatedScannedItems = [...scannedItems];
        const scannedItem = updatedScannedItems[existingIndex];
        
        if (scannedItem.scannedQuantity < item.quantity) {
          scannedItem.scannedQuantity += 1;
          setScannedItems(updatedScannedItems);
          
          // Check if we've scanned all of this SKU
          if (scannedItem.scannedQuantity === item.quantity) {
            setRemainingItems(prev => prev.filter((_, idx) => idx !== itemIndex));
          }
        } else {
          // Already scanned required quantity
          Alert.alert(
            'Already Scanned',
            `All ${item.quantity} units of ${item.name} have been scanned.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        // First time scanning this SKU
        const newScannedItem = {
          ...item,
          scannedQuantity: 1,
          scannedAt: new Date().toISOString(),
        };
        
        setScannedItems([...scannedItems, newScannedItem]);
        
        // If quantity is 1, remove from remaining items
        if (item.quantity === 1) {
          setRemainingItems(prev => prev.filter((_, idx) => idx !== itemIndex));
        }
      }

      // Success feedback with delay
      scanTimeout.current = setTimeout(() => {
        setIsProcessing(false);
      }, SCAN_DELAY_MS);

    } 
  };

  const handleToggleCamera = () => {
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleCompleteValidation = () => {
    if (remainingItems.length > 0) {
      Alert.alert(
        'Incomplete Scan',
        `You still have ${remainingItems.length} item(s) to scan. Are you sure you want to complete?`,
        [
          { text: 'Continue Scanning', style: 'cancel' },
          { 
            text: 'Complete Anyway', 
            onPress: () => {
              const totalScanned = scannedItems.reduce((sum, item) => sum + item.scannedQuantity, 0);
              const totalOrder = orderItems.reduce((sum, item) => sum + item.quantity, 0);
              
              navigation.navigate('OrderDetails', {
                validationResult: {
                  isValidated: false,
                  validationMethod: 'qr_scan',
                  validationDate: new Date().toISOString(),
                  scannedCount: totalScanned,
                  totalCount: totalOrder,
                  scannedItems: scannedItems,
                  remainingItems: remainingItems,
                },
                checkoutCode,
                checkoutData: route.params?.checkoutData,
              });
            }
          }
        ]
      );
      return;
    }

    // All items scanned successfully
    const totalScanned = scannedItems.reduce((sum, item) => sum + item.scannedQuantity, 0);
    const totalOrder = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    
    Alert.alert(
      'Validation Complete!',
      'All items have been successfully scanned.',
      [
        { 
          text: 'Return to Order', 
          onPress: () => {
            navigation.navigate('OrderDetails', {
              validationResult: {
                isValidated: true,
                validationMethod: 'qr_scan',
                validationDate: new Date().toISOString(),
                scannedCount: totalScanned,
                totalCount: totalOrder,
                scannedItems: scannedItems,
                remainingItems: [],
              },
              checkoutCode,
              checkoutData: route.params?.checkoutData,
            });
          }
        }
      ]
    );
  };

  const handleBack = () => {
    if (scannedItems.length > 0) {
      Alert.alert(
        'Exit Validation',
        'Your scan progress will be lost. Are you sure you want to exit?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Exit', 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const getItemProgress = (item) => {
    const scannedItem = scannedItems.find(si => si.sku === item.sku);
    const scannedQuantity = scannedItem ? scannedItem.scannedQuantity : 0;
    const progress = (scannedQuantity / item.quantity) * 100;
    
    return {
      scannedQuantity,
      progress,
      isComplete: scannedQuantity >= item.quantity,
    };
  };

  const totalScannedQuantity = scannedItems.reduce((sum, item) => sum + item.scannedQuantity, 0);
  const totalOrderQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const progressPercentage = totalOrderQuantity > 0 ? (totalScannedQuantity / totalOrderQuantity) * 100 : 0;

  // Add scanned items list
  const renderScannedItems = () => {
    if (scannedItems.length === 0) return null;

    return (
      <View style={styles.scannedCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="check-circle" size={22} color="#00A86B" />
          <Text style={styles.cardTitle}>Scanned Items</Text>
          <Text style={styles.scannedCountBadge}>
            {scannedItems.length}
          </Text>
        </View>

        <ScrollView 
          style={styles.scannedList} 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scannedListContent}
        >
          {scannedItems.map((item, index) => (
            <View key={`scanned_${item.sku}_${index}`} style={styles.scannedItem}>
              <View style={styles.scannedItemIcon}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#00A86B" />
              </View>
              <Text style={styles.scannedItemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.scannedItemQuantity}>
                {item.scannedQuantity}/{item.quantity}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Calculate positions
  const scanFrameTop = (SCREEN_HEIGHT - RESULTS_PANEL_HEIGHT - SCAN_FRAME_SIZE) / 1.5;

  return (
    <View style={styles.container}>
      {/* Camera View - Full Screen */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraFacing}
        barcodeScannerSettings={{
          barcodeTypes: ["ean8", "ean13", "upc_a", "upc_e", "code128"],
        }}
        onBarcodeScanned={isProcessing ? undefined : handleBarCodeScanned}
      />

      {/* Overlay with proper spacing for results panel */}
      <View style={StyleSheet.absoluteFill}>
        {/* Semi-transparent overlay */}
        <View style={styles.overlay}>
          {/* Top area above scan frame */}
          <View style={[styles.overlaySection, { height: scanFrameTop }]} />
          
          {/* Middle area with scan frame */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlayLeft} />
            <View style={[styles.scanFrame, { marginTop: scanFrameTop-131 }]}>
              {/* Corner markers */}
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />

              {/* Animated Scan Line */}
              <Animated.View 
                style={[
                  styles.scanLine,
                  {
                    transform: [{
                      translateY: scanAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, SCAN_FRAME_SIZE],
                      }),
                    }],
                  },
                ]}
              />
            </View>
            <View style={styles.overlayRight} />
          </View>
          
          {/* Bottom area for instructions */}
          <View style={[styles.overlayBottom, { height: RESULTS_PANEL_HEIGHT }]}>
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                Scan product barcodes
              </Text>
              <Text style={styles.instructionsSubtext}>
                Align barcode within the frame
              </Text>
              {isProcessing && (
                <View style={styles.scanDelayIndicator}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.scanDelayText}>Processing...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Barcode Validation</Text>
            <Text style={styles.headerSubtitle}>
              {remainingItems.length > 0 
                ? `${remainingItems.length} item(s) remaining` 
                : 'All items scanned'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cameraToggle}
            onPress={handleToggleCamera}
          >
            <MaterialCommunityIcons name="camera-flip" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Results Panel - Fixed position at bottom */}
      <View style={[styles.resultsPanel, { height: RESULTS_PANEL_HEIGHT }]}>
        <View style={styles.dragHandle}>
          <View style={styles.dragHandleBar} />
        </View>

        <ScrollView 
          style={styles.resultsScroll} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Progress Summary */}
          <View style={[styles.progressCard, scanComplete && styles.progressCompleteCard]}>
            <View style={styles.progressHeader}>
              <MaterialCommunityIcons 
                name={scanComplete ? "check-circle" : "progress-check"} 
                size={24} 
                color={scanComplete ? "#00A86B" : "#64748B"} 
              />
              <Text style={styles.progressTitle}>
                {scanComplete ? 'Scan Complete!' : 'Scan Progress'}
              </Text>
              <View style={[
                styles.progressBadge,
                scanComplete && styles.progressBadgeComplete
              ]}>
                <Text style={[
                  styles.progressBadgeText,
                  scanComplete && styles.progressBadgeTextComplete
                ]}>
                  {totalScannedQuantity}/{totalOrderQuantity}
                </Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: scanComplete ? '#00A86B' : '#3B82F6'
                    }
                  ]} 
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>
                  Scanned: {totalScannedQuantity}
                </Text>
                <Text style={styles.progressLabel}>
                  Remaining: {totalOrderQuantity - totalScannedQuantity}
                </Text>
              </View>
            </View>
          </View>

          {/* Items to Scan */}
          <View style={styles.itemsCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="format-list-checkbox" size={22} color="#64748B" />
              <Text style={styles.cardTitle}>Items to Scan</Text>
              <Text style={styles.cardSubtitle}>
                {remainingItems.length} remaining
              </Text>
            </View>

            {remainingItems.length > 0 ? (
              remainingItems.map((item, index) => {
                const progress = getItemProgress(item);
                
                return (
                  <View 
                    key={`${item.sku}_${index}`} 
                    style={[
                      styles.itemRow,
                      progress.isComplete && styles.itemRowComplete
                    ]}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemSku}>
                          SKU: {item.sku}
                        </Text>
                        {item.product?.barcode && (
                          <Text style={styles.itemBarcode}>
                            Barcode: {item.product.barcode}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.itemProgress}>
                      <Text style={styles.itemQuantity}>
                        {progress.scannedQuantity}/{item.quantity}
                      </Text>
                      <View style={styles.itemProgressBar}>
                        <View 
                          style={[
                            styles.itemProgressFill,
                            { width: `${progress.progress}%` }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="check-all" size={48} color="#00A86B" />
                <Text style={styles.emptyStateText}>All items scanned!</Text>
              </View>
            )}
          </View>

          {/* Scanned Items */}
          {renderScannedItems()}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.completeButton,
                scanComplete && styles.completeButtonSuccess,
                scannedItems.length === 0 && styles.completeButtonDisabled,
              ]}
              onPress={handleCompleteValidation}
              disabled={scannedItems.length === 0 || isProcessing}
            >
              <MaterialCommunityIcons
                name={scanComplete ? "check-circle" : "check-all"}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.completeButtonText}>
                {scanComplete ? 'Complete ✓' : 'Complete Validation'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, isProcessing && styles.cancelButtonDisabled]}
              onPress={handleBack}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.processingText}>Processing barcode...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlaySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  overlayLeft: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayBottom: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00A86B',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00A86B',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00A86B',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00A86B',
    borderBottomRightRadius: 8,
  },
  scanLine: {
    width: SCAN_FRAME_SIZE,
    height: 2,
    backgroundColor: '#00A86B',
    position: 'absolute',
    top: 0,
  },
  instructionsContainer: {
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  scanDelayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 168, 107, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  scanDelayText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A86B',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cameraToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E8F5EF',
    borderRadius: 2,
  },
  resultsScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F5EF',
  },
  progressCompleteCard: {
    borderColor: '#00A86B',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 10,
    flex: 1,
  },
  progressBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeComplete: {
    backgroundColor: '#F0F9F5',
  },
  progressBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  progressBadgeTextComplete: {
    color: '#00A86B',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8F5EF',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F5EF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemRowComplete: {
    opacity: 0.6,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 18,
  },
  itemDetails: {
    gap: 2,
  },
  itemSku: {
    fontSize: 11,
    color: '#94A3B8',
  },
  itemBarcode: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  itemProgress: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  itemQuantity: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemProgressBar: {
    width: 60,
    height: 3,
    backgroundColor: '#E8F5EF',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  itemProgressFill: {
    height: '100%',
    backgroundColor: '#00A86B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
    marginTop: 8,
  },
  scannedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F5EF',
  },
  scannedCountBadge: {
    backgroundColor: '#F0F9F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 11,
    color: '#00A86B',
    fontWeight: '600',
  },
  scannedList: {
    flexDirection: 'row',
  },
  scannedListContent: {
    paddingRight: 10,
  },
  scannedItem: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    marginRight: 10,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#E8F5EF',
  },
  scannedItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F9F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  scannedItemName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
    maxWidth: 90,
  },
  scannedItemQuantity: {
    fontSize: 10,
    color: '#00A86B',
    fontWeight: '700',
  },
  actionButtons: {
    gap: 10,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A86B',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  completeButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  completeButtonSuccess: {
    backgroundColor: '#00A86B',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 10,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
});

export default QRScanValidationScreen;