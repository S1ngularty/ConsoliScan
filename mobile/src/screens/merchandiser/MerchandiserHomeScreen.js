import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OfflineIndicator from "../../components/Common/OfflineIndicator";
import { logout } from "../../features/slices/auth/authThunks";

const { width } = Dimensions.get("window");

export default function MerchandiserHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const networkState = useSelector((state) => state.network);
  const user = useSelector((state) => state.auth.user);

  const [currentTime, setCurrentTime] = useState("");
  const [greeting, setGreeting] = useState("");
  const [stats, setStats] = useState({
    productsScanned: 0,
    productsUpdated: 0,
    productsAdded: 0,
  });

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, []),
  );

  const updateTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setCurrentTime(timeString);

    const hour = now.getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  };

  const loadStats = async () => {
    try {
      const statsData = await AsyncStorage.getItem("merchandiserStats");
      if (statsData) {
        setStats(JSON.parse(statsData));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleScanProduct = () => {
    navigation.navigate("ProductScan");
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
              // The logout thunk will clear AsyncStorage
              // Navigation will be handled automatically by auth state change
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{greeting}!</Text>
            <Text style={styles.userName}>{user?.name || "Merchandiser"}</Text>
            <Text style={styles.time}>{currentTime}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Action Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Action</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanProduct}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="barcode-scan"
              size={48}
              color="#fff"
            />
            <Text style={styles.scanButtonText}>Scan Product</Text>
            <Text style={styles.scanButtonSubtext}>
              Check, update, or add products
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: "#4CAF50" }]}>
              <MaterialCommunityIcons
                name="barcode-scan"
                size={32}
                color="#fff"
              />
              <Text style={styles.statNumber}>{stats.productsScanned}</Text>
              <Text style={styles.statLabel}>Scanned</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: "#2196F3" }]}>
              <MaterialIcons name="edit" size={32} color="#fff" />
              <Text style={styles.statNumber}>{stats.productsUpdated}</Text>
              <Text style={styles.statLabel}>Updated</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: "#FF9800" }]}>
              <MaterialIcons name="add-circle" size={32} color="#fff" />
              <Text style={styles.statNumber}>{stats.productsAdded}</Text>
              <Text style={styles.statLabel}>Added</Text>
            </View>
          </View>
        </View>

        {/* Instructions Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How to Use</Text>
          <View style={styles.instruction}>
            <MaterialCommunityIcons
              name="numeric-1-circle"
              size={24}
              color="#2E7D32"
            />
            <Text style={styles.instructionText}>
              Tap "Scan Product" to start scanning
            </Text>
          </View>
          <View style={styles.instruction}>
            <MaterialCommunityIcons
              name="numeric-2-circle"
              size={24}
              color="#2E7D32"
            />
            <Text style={styles.instructionText}>
              If product exists, update stock and price
            </Text>
          </View>
          <View style={styles.instruction}>
            <MaterialCommunityIcons
              name="numeric-3-circle"
              size={24}
              color="#2E7D32"
            />
            <Text style={styles.instructionText}>
              If product doesn't exist, fill the form to add it
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#2E7D32",
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  userName: {
    fontSize: 16,
    color: "#C8E6C9",
    marginTop: 4,
  },
  time: {
    fontSize: 14,
    color: "#A5D6A7",
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    elevation: 3,
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: "#C8E6C9",
    marginTop: 4,
  },
  statsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#fff",
    marginTop: 4,
  },
  instruction: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
  },
});
