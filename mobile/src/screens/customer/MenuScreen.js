import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Switch,
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

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: true,
    promoNotifications: true,
  });

  const [loyaltyInfo] = useState({
    points: 1250,
    tier: "Gold",
    nextTier: "Platinum",
    pointsNeeded: 250,
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

  // Local sub-component for Preference Items
  const PreferenceItem = ({ title, description, value, onToggle }) => (
    <View style={styles.preferenceItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#e2e8f0", true: "#00A86B" }}
        thumbColor="#fff"
      />
    </View>
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

          {/* --- LOYALTY STATUS --- */}
          <View style={styles.loyaltySection}>
            <View style={styles.loyaltyHeader}>
              <MaterialCommunityIcons
                name="trophy-outline"
                size={18}
                color="#0f172a"
              />
              <Text style={styles.loyaltyTitle}>{loyaltyInfo.tier} Member</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(loyaltyInfo.points / (loyaltyInfo.points + loyaltyInfo.pointsNeeded)) * 100}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>
                  {loyaltyInfo.points.toLocaleString()} pts
                </Text>
                <Text style={styles.progressText}>
                  {loyaltyInfo.pointsNeeded} to {loyaltyInfo.nextTier}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- QUICK STATS --- */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {loyaltyInfo.points.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>18</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Rewards</Text>
          </View>
        </View>

        {/* --- PREFERENCES --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <PreferenceItem
            title="Push Notifications"
            description="Receive app notifications"
            value={preferences.notifications}
            onToggle={() =>
              setPreferences({
                ...preferences,
                notifications: !preferences.notifications,
              })
            }
          />
          <PreferenceItem
            title="Email Updates"
            description="Receive email newsletters"
            value={preferences.emailUpdates}
            onToggle={() =>
              setPreferences({
                ...preferences,
                emailUpdates: !preferences.emailUpdates,
              })
            }
          />
          <PreferenceItem
            title="Promotional Notifications"
            description="Get special offers & deals"
            value={preferences.promoNotifications}
            onToggle={() =>
              setPreferences({
                ...preferences,
                promoNotifications: !preferences.promoNotifications,
              })
            }
          />
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
                item.path === "Help" || item.path ==="About"
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
    marginBottom: 24,
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

  // Loyalty Section
  loyaltySection: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  loyaltyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  loyaltyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00A86B",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginTop: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    backgroundColor: "#f1f5f9",
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

  // Preference Item
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  preferenceDesc: {
    fontSize: 12,
    color: "#64748b",
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
