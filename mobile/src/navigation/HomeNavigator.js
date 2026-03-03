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
// import FloatingChatbot from "../components/FloatingChatbot";

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
              <TouchableOpacity
                key={route.key}
                style={styles.scanButton}
                onPress={onPress}
                activeOpacity={0.9}
              >
                <View style={styles.scanButtonInner}>
                  <MaterialCommunityIcons
                    name="qrcode-scan"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            );
          }

          // Icons for other tabs
          const getIconName = (routeName) => {
            switch (routeName) {
              case "Home":
                return isFocused ? "home" : "home-outline";
              case "History":
                return isFocused ? "clock-outline" : "clock-outline";
              case "Cart":
                return isFocused ? "shopping-outline" : "shopping-outline";
              case "Menu":
                return isFocused ? "menu" : "menu";
              default:
                return "home-outline";
            }
          };

          const getLabel = (routeName) => {
            switch (routeName) {
              case "Home":
                return "Home";
              case "History":
                return "History";
              case "Cart":
                return "Cart";
              case "Menu":
                return "Menu";
              default:
                return "";
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={getIconName(route.name)}
                size={22}
                color={isFocused ? "#2D3A4A" : "#9AA6B2"}
              />
              {isFocused && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function HomeNavigator() {
  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ 
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F0F4F8',
          }
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
            tabBarStyle: { display: 'none' }
          }}
        />
        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{ title: "Cart" }}
        />
        <Tab.Screen
          name="Menu"
          component={MenuScreen}
          options={{ title: "Menu" }}
        />
      </Tab.Navigator>
      {/* <FloatingChatbot /> */}
    </>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    height: 72,
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F4F8",
    // Subtle shadow
    shadowColor: "#2D3A4A",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingVertical: 12,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2D3A4A",
  },
  scanButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    transform: [{ translateY: -16 }],
  },
  scanButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#2D3A4A",
    justifyContent: "center",
    alignItems: "center",
    // Subtle shadow
    shadowColor: "#2D3A4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});