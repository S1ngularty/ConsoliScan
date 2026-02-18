import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {logout} from "../features/slices/auth/authThunks"
import { useDispatch } from "react-redux";

// Import screens
import HomeScreen from "../screens/cashier/HomeScreen";
import TransactionScreen from "../screens/cashier/TransactionScreen";
import InventoryScreen from "../screens/cashier/InventoryScreen";
import ReportsScreen from "../screens/cashier/ReportScreen";
import ProfileScreen from "../screens/cashier/ProfileScreen";

// Import logout action (update path based on your project structure)
// import { logout } from "../store/slices/authSlice";
import {useSelector} from "react-redux";

const Drawer = createDrawerNavigator();

// Custom Drawer Content
const CustomDrawerContent = ({ state, descriptors, navigation, userState}) => {
  const dispatch = useDispatch(); // Add useDispatch here

  const handleLogout = () => {
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
            dispatch(logout());
          } catch (err) {
            console.error("Logout failed:", err);
            Alert.alert("Error", "Logout failed. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.drawerContainer}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.headerLogo}>
          <MaterialCommunityIcons name="shopping" size={32} color="#00A86B" />
          <Text style={styles.headerTitle}>ConsoliScan</Text>
        </View>
        <Text style={styles.headerSubtitle}>Cashier System</Text>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <MaterialCommunityIcons name="account" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userState?.user?.name || "Guest User"}</Text>
            <Text style={styles.userRole}>{userState?.user?.role || "Cashier"}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            navigation.closeDrawer();
            navigation.navigate(route.name);
          };

          // Icons for each menu item
          const getIconName = (routeName) => {
            switch (routeName) {
              case "Home":
                return isFocused ? "home" : "home-outline";
              case "Transaction":
                return isFocused ? "cash-register" : "cash-register-outline";
              case "Inventory":
                return isFocused ? "package-variant" : "package-variant-closed";
              case "Reports":
                return isFocused ? "chart-bar" : "chart-bar-outline";
              case "Profile":
                return isFocused ? "account" : "account-outline";
              default:
                return "home";
            }
          };

          // Labels for each menu item
          const getLabel = (routeName) => {
            switch (routeName) {
              case "Home":
                return "Dashboard";
              case "Transaction":
                return "New Transaction";
              case "Inventory":
                return "Inventory";
              case "Reports":
                return "Reports";
              case "Profile":
                return "Profile";
              default:
                return routeName;
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.menuItem, isFocused && styles.menuItemActive]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <MaterialCommunityIcons
                  name={getIconName(route.name)}
                  size={24}
                  color={isFocused ? "#00A86B" : "#666"}
                />
              </View>
              <Text
                style={[styles.menuLabel, isFocused && styles.menuLabelActive]}
              >
                {getLabel(route.name)}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <MaterialCommunityIcons name="cog-outline" size={22} color="#666" />
          <Text style={styles.footerText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => navigation.navigate('Help')}
        >
          <MaterialCommunityIcons
            name="help-circle-outline"
            size={22}
            color="#666"
          />
          <Text style={styles.footerText}>Help & Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
          <Text style={[styles.footerText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main Drawer Navigator
export default function DrawerNavigator() {
  const userState = useSelector((state) => state.auth);
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} userState={userState} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: "#FFFFFF",
          width: 300,
        },
        drawerType: "front",
        overlayColor: "rgba(0, 0, 0, 0.5)",
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          drawerLabel: "Dashboard",
          title: "Dashboard",
        }}
      />
      <Drawer.Screen 
        name="Transaction" 
        component={TransactionScreen}
        options={{
          drawerLabel: "New Transaction",
          title: "New Transaction",
        }}
      />
      <Drawer.Screen 
        name="Inventory" 
        component={InventoryScreen}
        options={{
          drawerLabel: "Inventory",
          title: "Inventory",
        }}
      />
      <Drawer.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          drawerLabel: "Reports",
          title: "Reports",
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerLabel: "Profile",
          title: "Profile",
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: "#FFFFFF",
  },
  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 12,
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 24,
    marginLeft: 4,
    fontFamily: 'Inter_400Regular',
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8F5EF",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  userRole: {
    fontSize: 13,
    color: "#64748B",
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 24,
    marginVertical: 8,
  },
  menuContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginVertical: 2,
    position: "relative",
  },
  menuItemActive: {
    backgroundColor: "rgba(0, 168, 107, 0.08)",
  },
  menuIconContainer: {
    width: 40,
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
    marginLeft: 8,
    fontFamily: 'Inter_500Medium',
  },
  menuLabelActive: {
    color: "#00A86B",
    fontWeight: "600",
    fontFamily: 'Inter_600SemiBold',
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#00A86B",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 16,
    fontFamily: 'Inter_500Medium',
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: "#EF4444",
    fontFamily: 'Inter_600SemiBold',
  },
});