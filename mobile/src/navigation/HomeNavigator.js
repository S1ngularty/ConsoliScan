import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native"; // Added import

// Import your screens
// import HomeScreen from "../screens/customer/HomeScreen";
// import TransactionsScreen from "../screens/customer/TransactionsScreen";
// import ProfileScreen from "../screens/customer/ProfileScreen";

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
            case "Profile":
              return isFocused ? "account" : "account-outline";
            default:
              return "home";
          }
        };

        return (
          <View key={route.key} style={styles.tabItem}>
            <TouchableOpacity
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={getIconName(route.name)}
                size={24}
                color={isFocused ? "#00A86B" : "#666"}
              />
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              >
                {options.title || route.name}
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
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen
          // name="Home"
          // component={HomeScreen}
          // options={{ title: "Home" }}
        />
        <Tab.Screen
          // name="Transactions"
          // component={TransactionsScreen}
          // options={{ title: "Transactions" }}
        />
        <Tab.Screen
          // name="Profile"
          // component={ProfileScreen}
          // options={{ title: "Profile" }}
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