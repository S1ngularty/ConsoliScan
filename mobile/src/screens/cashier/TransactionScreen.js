import React, {useState} from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ScanMethodModal from "../../components/cashier/ScanMethodModal";

const TransactionScreen = ({ navigation }) => {
  const [showScanModal, setShowScanModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Transactions</Text>
        </View>

        <View style={styles.headerRight}>
          <MaterialCommunityIcons
            name="barcode-scan"
            size={24}
            color="#FFFFFF"
          />
        </View>
      </View>

      <ScanMethodModal
        visible={showScanModal} // Controls visibility
        onClose={() => setShowScanModal(false)} // Function to close
        navigation={navigation} // Pass navigation prop
      />

      <View style={styles.content}>
        <View style={styles.placeholder}>
          <MaterialCommunityIcons
            name="cash-register"
            size={80}
            color="#00A86B"
          />
          <Text style={styles.placeholderText}>Transaction Screen</Text>
          <Text style={styles.placeholderSubtext}>Scan products to begin</Text>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setShowScanModal(true)}
          >
            <MaterialCommunityIcons
              name="barcode-scan"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.scanButtonText}>New Transaction</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#00A86B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  menuButton: {
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
  headerRight: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    alignItems: "center",
    padding: 40,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 20,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 30,
  },
  scanButton: {
    backgroundColor: "#00A86B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default TransactionScreen;
