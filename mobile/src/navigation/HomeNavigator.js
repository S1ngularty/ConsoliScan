import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/customer/HomeScreen";
import MenuScreen from "../screens/customer/MenuScreen";
import CartScreen from "../screens/customer/CartScreen";
import OrderHistoryScreen from "../screens/customer/OrderHistory";
import ScanningScreen from "../screens/customer/ScanningScreen";

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  // Get current route options
  const currentRoute = state.routes[state.index];
  const currentOptions = descriptors[currentRoute.key]?.options;

  // Check if tabBarStyle is set to display: none
  if (currentOptions?.tabBarStyle?.display === "none") {
    return null; // Hide tab bar completely
  }

  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Special handling for Scan button
          if (route.name === "Scan") {
            return (
              <View key={route.key} style={styles.scanButtonContainer}>
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={onPress}
                  activeOpacity={0.9}
                >
                  <MaterialCommunityIcons
                    name="barcode-scan"
                    size={32}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            );
          }

          // Icons for other tabs
          const getIconName = (routeName) => {
            switch (routeName) {
              case "Home":
                return isFocused ? "home" : "home-outline";
              case "History":
                return isFocused ? "receipt" : "receipt-outline";
              case "Cart":
                return isFocused ? "cart" : "cart-outline";
              case "Menu":
                return isFocused ? "menu" : "menu";
              default:
                return "home";
            }
          };

          const getIconComponent = (routeName) => {
            if (routeName === "Menu") {
              return Ionicons;
            }
            return MaterialCommunityIcons;
          };

          const IconComponent = getIconComponent(route.name);
          const iconName = getIconName(route.name);

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <IconComponent
                name={iconName}
                size={route.name === "Menu" ? 26 : 24}
                color={isFocused ? "#00A86B" : "#94a3b8"}
              />
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              >
                {route.name === "Menu" ? "More" : options.title || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function HomeNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute", // Required for floating effect
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="History"
        component={OrderHistoryScreen}
        options={{ title: "History" }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanningScreen}
        options={{
          title: "Scan",
          tabBarStyle: { display: "none" }, // Optionally hide tab bar on scan screen
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Cart",
          tabBarStyle: { display: "none" },
        }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{ title: "More" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 35,
    height: 70,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    width: "100%",
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    // Elevation for Android
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  scanButtonContainer: {
    top: -25, // Move it up to float
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  scanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
    // Shadow for the button
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#f2f2f2", // Match background color or transparent
  },
  tabLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#00A86B",
    fontWeight: "700",
  },
});
