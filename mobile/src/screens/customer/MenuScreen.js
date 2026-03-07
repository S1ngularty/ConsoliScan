import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { saveLocally } from "../../features/slices/cart/cartThunks";
import { useDispatch, useSelector } from "react-redux";
import { debounceCartSync } from "../../features/slices/cart/cartDebounce";
import { logout } from "../../features/slices/auth/authThunks";

const MenuScreen = ({ navigation }) => {
  const userState = useSelector((state) => state.auth.user);
  const [user, setUser] = useState({
    name: userState.name,
    email: userState.email,
    phone: "+1 (555) 123-4567",
    memberSince: "January 2024",
  });

  const dispatch = useDispatch();

  // Local sub-component for Menu Items
  const MenuItem = ({ title, icon, isLast, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
    >
      <View style={styles.menuIcon}>
        <MaterialCommunityIcons name={icon} size={20} color="#0f172a" />
      </View>
      <Text style={styles.menuText}>{title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color="#64748b" />
    </TouchableOpacity>
  );

  const menuItems = [
    {
      id: 1,
      title: "Personal Information",
      icon: "account-outline",
      path: "Profile",
    },
    {
      id: 2,
      title: "Eligibilty Discount",
      icon: "tag-outline",
      path: "EligibilityIntro",
    },
    { id: 4, title: "Order History", icon: "history", path: "History" },
    { id: 5, title: "Saved Items", icon: "heart-outline", path: "Saved" },
    { id: 6, title: "Security", icon: "shield-lock-outline", path: "Security" },
    {
      id: 7,
      title: "Help & Support",
      icon: "help-circle-outline",
      path: "Help",
    },
    { id: 8, title: "About App", icon: "information-outline", path: "About" },
  ];

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // dispatch(saveLocally());
            debounceCartSync(dispatch);

            dispatch(logout());
          } catch (err) {
            console.error("Logout failed:", err);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Menu</Text>
          <Text style={styles.headerSubtitle}>Account & preferences</Text>
        </View>
        <TouchableOpacity style={styles.settingsIcon}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color="#0f172a"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- PROFILE CARD --- */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.memberSince}>
                Member since {user.memberSince}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                navigation.navigate("Profile");
              }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={16}
                color="#0f172a"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- QUICK ACTIONS ---
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("Scanning")}
          >
            <View style={styles.quickActionIcon}>
              <MaterialCommunityIcons
                name="barcode-scan"
                size={24}
                color="#00A86B"
              />
            </View>
            <Text style={styles.quickActionLabel}>Start Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("Cart")}
          >
            <View style={styles.quickActionIcon}>
              <MaterialCommunityIcons
                name="cart-outline"
                size={24}
                color="#00A86B"
              />
            </View>
            <Text style={styles.quickActionLabel}>View Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("History")}
          >
            <View style={styles.quickActionIcon}>
              <MaterialCommunityIcons
                name="receipt"
                size={24}
                color="#00A86B"
              />
            </View>
            <Text style={styles.quickActionLabel}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("Saved")}
          >
            <View style={styles.quickActionIcon}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={24}
                color="#00A86B"
              />
            </View>
            <Text style={styles.quickActionLabel}>Saved</Text>
          </TouchableOpacity>
        </View> */}

        {/* --- APP FEATURES --- */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={20}
                color="#00A86B"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Fast Mode Scanning</Text>
              <Text style={styles.featureDesc}>
                Quick checkout with continuous barcode scanning
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <MaterialCommunityIcons
                name="tag-outline"
                size={20}
                color="#00A86B"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Exclusive Discounts</Text>
              <Text style={styles.featureDesc}>
                Check eligibility for special pricing
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomWidth: 0 }]}>
            <View style={styles.featureIconContainer}>
              <MaterialCommunityIcons
                name="clock-fast"
                size={20}
                color="#00A86B"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Skip the Line</Text>
              <Text style={styles.featureDesc}>
                Scan, pay, and go without waiting
              </Text>
            </View>
          </View>
        </View>

        {/* --- MENU --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.map((item, index) => (
            <MenuItem
              key={item.id}
              title={item.title}
              icon={item.icon}
              isLast={index === menuItems.length - 1}
              onPress={() =>
                item.path === "Help" || item.path === "About"
                  ? navigation.navigate("Shared", {
                      screen: item.path,
                    })
                  : navigation.navigate(item.path)
              }
            />
          ))}
        </View>

        {/* --- LOGOUT BUTTON --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* --- VERSION --- */}
        <Text style={styles.versionText}>ConsoliScan v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    color: "#0f172a",
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "500",
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginTop: 10,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 16,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f0fdf9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },

  // Features Card
  featuresCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginTop: 16,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f0fdf9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },

  // Section Card
  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginTop: 16,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 20,
  },

  // Menu Item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  // Logout Button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginTop: 24,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ef4444",
    marginLeft: 10,
  },

  // Version Text
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 30,
    fontWeight: "600",
  },
});

export default MenuScreen;
