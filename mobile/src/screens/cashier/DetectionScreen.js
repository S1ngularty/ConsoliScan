// screens/cashier/ObjectDetectionScreen.jsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function ObjectDetectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { checkoutCode, orderItems = [] } = route.params || {};
  
  const [permission, requestPermission] = useCameraPermissions();
  const [count, setCount] = useState(0);
  const [detectedItems, setDetectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("back");
  const [scans, setScans] = useState([]);
  const [validationComplete, setValidationComplete] = useState(false);
  const cameraRef = useRef(null);

  // Get total items expected from order
  const totalExpectedItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate validation status
  const validationStatus = count === totalExpectedItems ? 'success' : 
                         count > totalExpectedItems ? 'extra' : 'missing';

  const getStatusColor = () => {
    switch (validationStatus) {
      case 'success': return '#00A86B';
      case 'extra': return '#FF9800';
      case 'missing': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getStatusMessage = () => {
    if (validationStatus === 'success') {
      return 'All items match!';
    } else if (validationStatus === 'extra') {
      return `Extra items detected (${count} vs ${totalExpectedItems})`;
    } else {
      return `Missing items (${count} vs ${totalExpectedItems})`;
    }
  };

  useEffect(() => {
    if (validationComplete && validationStatus === 'success') {
      Alert.alert(
        'Validation Complete',
        'All items match the order.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [validationComplete]);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialCommunityIcons name="camera-off" size={80} color="#64748B" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera permission to detect items
        </Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.grantButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const runDetection = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    setScanning(true);

    try {
      // Take picture
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 0.8,
        skipProcessing: false,
      });

      // Show loading indicator

      // Prepare form data
      const data = new FormData();
      data.append("file", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "detection.jpg",
      });

      // Call FastAPI backend (Update IP as needed)
      const res = await fetch("http://192.168.1.11:8000/detect", {
        method: "POST",
        body: data,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const json = await res.json();
      console.log(json)
      if (json.count !== undefined) {
        const newCount = json.count;
        setCount(newCount);
        
        // Add to scan history
        const newScan = {
          id: Date.now(),
          count: newCount,
          timestamp: new Date().toLocaleTimeString(),
          matched: newCount === totalExpectedItems,
        };
        setScans(prev => [newScan, ...prev.slice(0, 4)]); // Keep last 5 scans
        
        // Update detected items (mock data for now)
        const mockDetectedItems = orderItems.map(item => ({
          ...item,
          detected: Math.floor(Math.random() * (item.quantity + 2)),
        }));
        setDetectedItems(mockDetectedItems);

      } else if (json.error) {
        Alert.alert("Detection Error", json.error);
      }

    } catch (error) {
      console.log("Detection request error:", error);
      Alert.alert("Error", "Failed to connect to detection service. Please try again.");
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleToggleCamera = () => {
    setCameraFacing(current => (current === "back" ? "front" : "back"));
  };

  const handleCompleteValidation = () => {
    if (count === 0) {
      Alert.alert("No Items Detected", "Please scan items first.");
      return;
    }
    
    setValidationComplete(true);
  };

  const handleRetry = () => {
    setValidationComplete(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Object Detection</Text>
          <Text style={styles.headerSubtitle}>Checkout: {checkoutCode}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.flipButton}
          onPress={handleToggleCamera}
        >
          <MaterialCommunityIcons name="camera-flip" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          ratio="16:9"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              
              {scanning && (
                <View style={styles.scanningIndicator}>
                  <ActivityIndicator color="#00A86B" size="large" />
                  <Text style={styles.scanningText}>Detecting...</Text>
                </View>
              )}
            </View>
            
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                Place items within the frame
              </Text>
              <Text style={styles.instructionSubtext}>
                Ensure good lighting and clear view
              </Text>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Detection Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.detectButton, loading && styles.detectButtonDisabled]}
          onPress={runDetection}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="camera" size={22} color="#FFFFFF" />
              <Text style={styles.detectButtonText}>Detect Items</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Panel */}
      <ScrollView style={styles.resultsContainer}>
        {/* Count Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <MaterialCommunityIcons name="counter" size={24} color="#64748B" />
            <Text style={styles.summaryTitle}>Detection Results</Text>
          </View>
          
          <View style={styles.countRow}>
            <View style={styles.countItem}>
              <Text style={styles.countLabel}>Detected</Text>
              <Text style={styles.countValue}>{count}</Text>
            </View>
            
            <View style={styles.countDivider} />
            
            <View style={styles.countItem}>
              <Text style={styles.countLabel}>Expected</Text>
              <Text style={styles.countValue}>{totalExpectedItems}</Text>
            </View>
            
            <View style={styles.countDivider} />
            
            <View style={styles.countItem}>
              <Text style={styles.countLabel}>Status</Text>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {validationStatus.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={[styles.statusMessage, { backgroundColor: `${getStatusColor()}20` }]}>
            <MaterialCommunityIcons 
              name={validationStatus === 'success' ? "check-circle" : "alert-circle"} 
              size={20} 
              color={getStatusColor()} 
            />
            <Text style={[styles.statusMessageText, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
          </View>
        </View>

        {/* Item Breakdown */}
        {detectedItems.length > 0 && (
          <View style={styles.itemsCard}>
            <View style={styles.itemsHeader}>
              <MaterialCommunityIcons name="format-list-bulleted" size={22} color="#64748B" />
              <Text style={styles.itemsTitle}>Item Details</Text>
            </View>
            
            {detectedItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                </View>
                
                <View style={styles.itemCounts}>
                  <View style={styles.countBadge}>
                    <Text style={styles.expectedCount}>Exp: {item.quantity}</Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Text style={styles.detectedCount}>Det: {item.detected}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Scan History */}
        {scans.length > 0 && (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <MaterialCommunityIcons name="history" size={22} color="#64748B" />
              <Text style={styles.historyTitle}>Recent Scans</Text>
            </View>
            
            {scans.map((scan, index) => (
              <View key={scan.id} style={styles.scanItem}>
                <View style={styles.scanInfo}>
                  <MaterialCommunityIcons 
                    name={scan.matched ? "check-circle" : "alert-circle"} 
                    size={18} 
                    color={scan.matched ? "#00A86B" : "#FF9800"} 
                  />
                  <Text style={styles.scanTime}>{scan.timestamp}</Text>
                </View>
                <Text style={styles.scanCount}>{scan.count} items</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            (count === 0 || validationComplete) && styles.completeButtonDisabled
          ]}
          onPress={validationComplete ? handleRetry : handleCompleteValidation}
          disabled={count === 0 || validationComplete}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name={validationComplete ? "refresh" : "check-circle"} 
            size={22} 
            color="#FFFFFF" 
          />
          <Text style={styles.completeButtonText}>
            {validationComplete ? "Scan Again" : "Complete Validation"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  grantButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A86B",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  grantButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A86B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#E8F5EF",
    marginTop: 2,
  },
  flipButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 2,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 300,
    height: 300,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cornerTL: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00A86B",
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00A86B",
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00A86B",
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00A86B",
    borderBottomRightRadius: 8,
  },
  scanningIndicator: {
    position: "absolute",
    alignItems: "center",
    gap: 8,
  },
  scanningText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  instructionContainer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  instructionSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8F5EF",
  },
  detectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  detectButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  detectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5EF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 10,
  },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  countItem: {
    alignItems: "center",
    flex: 1,
  },
  countLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  countValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
  },
  countDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E8F5EF",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusMessageText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  itemsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5EF",
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: "#94A3B8",
  },
  itemCounts: {
    flexDirection: "row",
    gap: 8,
  },
  countBadge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  expectedCount: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  detectedCount: {
    fontSize: 12,
    color: "#00A86B",
    fontWeight: "600",
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5EF",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 10,
  },
  scanItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  scanInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanTime: {
    fontSize: 14,
    color: "#64748B",
  },
  scanCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
  },
  completeButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});