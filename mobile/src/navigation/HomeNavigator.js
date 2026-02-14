import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import HomeScreen from "../screens/customer/HomeScreen";
import TransactionsScreen from "../screens/customer/TransactionScreen";
import MenuScreen from "../screens/customer/MenuScreen"; // Changed from ProfileScreen
import CartScreen from "../screens/customer/CartScreen";
import OrderHistoryScreen from "../screens/customer/OrderHistory";

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabContainer}>
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

        // Icons for each tab
        const getIconName = (routeName) => {
          switch (routeName) {
            case "Home":
              return isFocused ? "home" : "home-outline";
            case "Transactions":
              return isFocused ? "receipt" : "receipt-outline";
            case "Cart":
              return isFocused ? "cart" : "cart-outline";
            case "Menu": // Changed from Profile
              return isFocused ? "menu" : "menu"; // Hamburger menu icon
            default:
              return "home";
          }
        };

        const getIconComponent = (routeName) => {
          if (routeName === "Menu") {
            // Use Ionicons for better menu icon
            return Ionicons;
          }
          return MaterialCommunityIcons;
        };

        const IconComponent = getIconComponent(route.name);
        const iconName = getIconName(route.name);

        return (
          <View key={route.key} style={styles.tabItem}>
            <TouchableOpacity
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <IconComponent
                name={iconName}
                size={route.name === "Menu" ? 26 : 24}
                color={isFocused ? "#00A86B" : "#666"}
              />
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              >
                {route.name === "Menu" ? "More" : options.title || route.name}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

export default function HomeNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: "Cart" }}
      />
      <Tab.Screen
        name="Transactions"
        component={OrderHistoryScreen}
        options={{ title: "History"}}
      />
      <Tab.Screen
        name="Menu" // Changed from Profile
        component={MenuScreen} // Changed from ProfileScreen
        options={{ title: "More" }}
      />
    </Tab.Navigator>
  );
}

const styles = {
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: "rgba(0, 168, 107, 0.1)",
  },
  tabLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#00A86B",
    fontWeight: "700",
  },
};
