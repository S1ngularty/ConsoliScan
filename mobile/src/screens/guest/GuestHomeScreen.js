import React from "react";
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { resetState } from "../../features/slices/auth/authSlice";

export default function GuestHomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch()

  function handleLogin(){
    dispatch(resetState())
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Minimal Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ConsoliScan</Text>
          <Text style={styles.headerSubtitle}>Guest Access</Text>
        </View>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.container}>
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Begin Transaction</Text>
          <Text style={styles.subtitle}>
            Select an option to start
          </Text>
        </View>

        {/* Primary Action - Scan */}
        <TouchableOpacity
          style={styles.primaryCard}
          onPress={() => navigation.navigate("Shared", { screen: "Scan" })}
          activeOpacity={0.9}
        >
          <View style={styles.cardIconContainer}>
            <MaterialIcons name="qr-code-scanner" size={32} color="#00A86B" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Scan Items</Text>
            <Text style={styles.cardDescription}>
              Add items to cart by scanning barcodes
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#00A86B" />
        </TouchableOpacity>

        {/* Secondary Action - Cart */}
        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => navigation.navigate("Shared", { screen: "Cart" })}
          activeOpacity={0.9}
        >
          <View style={styles.cardIconContainer}>
            <MaterialIcons name="shopping-cart" size={32} color="#64748B" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>View Cart</Text>
            <Text style={styles.cardDescription}>
              Review items and proceed to checkout
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#64748B" />
        </TouchableOpacity>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => navigation.navigate("Shared",{screen:"Help"})}
            activeOpacity={0.7}
          >
            <MaterialIcons name="help-outline" size={20} color="#3B82F6" />
            <Text style={styles.helpText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Minimal Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          System • Online
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#00A86B",
    borderRadius: 6,
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 24,
  },
  primaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#00A86B",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  secondaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    lineHeight: 20,
  },
  helpSection: {
    alignItems: "center",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});