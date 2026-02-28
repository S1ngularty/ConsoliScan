import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { initiateReturn } from "../../api/return.api";

const ReturnScreen = ({ navigation, route }) => {
  const { order, itemId } = route.params || {};
  const [selectedItem, setSelectedItem] = useState(null);
  const [returnReason, setReturnReason] = useState(null);
  const [returnNotes, setReturnNotes] = useState("");
  const [initiating, setInitiating] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  /* ── Auto-select item if provided ── */
  useEffect(() => {
    if (!order || !itemId) return;
    const item = order.items?.find(
      (i) => i.product === itemId || i._id === itemId,
    );
    if (item && item.status === "SOLD") {
      handleSelectItem(item);
    }
  }, [order, itemId]);

  const handleSelectItem = (item) => {
    if (item.status !== "SOLD") {
      Alert.alert("Not Eligible", "This item cannot be returned");
      return;
    }
    setSelectedItem(item);
  };

  const handleInitiateReturn = async () => {
    if (!selectedItem) {
      Alert.alert("Error", "Please select an item");
      return;
    }
    if (!returnReason) {
      Alert.alert("Error", "Please select a reason for return");
      return;
    }

    setInitiating(true);

    try {
      // API call to initiate return
      const returnData = await initiateReturn({
        orderId: order._id,
        itemId: selectedItem.product || selectedItem._id,
        returnReason: returnReason,
        returnReasonNotes: returnNotes,
      });

      // Navigate to QR screen
      navigation.navigate("ReturnQR", {
        returnId: returnData._id,
        qrToken: returnData.qrToken,
        itemName: selectedItem.name,
        itemPrice: selectedItem.unitPrice,
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to initiate return");
    } finally {
      setInitiating(false);
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color="#EF4444"
          />
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const returnReasons = [
    { id: "changed_mind", label: "Changed my mind", icon: "heart-broken" },
    { id: "defective", label: "Defective", icon: "wrench-clock" },
    { id: "damaged", label: "Damaged", icon: "alert-circle" },
    {
      id: "not_as_described",
      label: "Not as described",
      icon: "text-box-remove",
    },
    { id: "wrong_item", label: "Wrong item received", icon: "package-remove" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#1E293B"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Return Item</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Order Info */}
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <MaterialCommunityIcons
                name="receipt"
                size={18}
                color="#00A86B"
              />
              <Text style={styles.orderCode}>{order.checkoutCode}</Text>
            </View>
            <Text style={styles.orderDate}>
              {new Date(order.confirmedAt).toLocaleDateString()} · ₱
              {order.finalAmountPaid?.toFixed(2)}
            </Text>
          </View>

          {/* Select Item */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Item to Return</Text>
            <View style={styles.itemsList}>
              {order.items?.map((item) => {
                const isEligible = item.status === "SOLD";
                const isSelected = selectedItem?._id === item._id;

                return (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.itemCard,
                      isSelected && styles.itemCardSelected,
                      !isEligible && styles.itemCardDisabled,
                    ]}
                    onPress={() => isEligible && handleSelectItem(item)}
                    disabled={!isEligible}
                  >
                    <View style={styles.itemCheckbox}>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={24}
                          color="#00A86B"
                        />
                      )}
                      {!isSelected && isEligible && (
                        <View style={styles.emptyCheckbox} />
                      )}
                      {!isEligible && (
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={24}
                          color="#9CA3AF"
                        />
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemDetails}>
                        ₱{item.unitPrice?.toFixed(2)} × {item.quantity}
                      </Text>
                      {!isEligible && (
                        <Text style={styles.notEligible}>
                          Status: {item.status}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Return Reason */}
          {selectedItem && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reason for Return</Text>
              <View style={styles.reasonsList}>
                {returnReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonCard,
                      returnReason === reason.id && styles.reasonCardSelected,
                    ]}
                    onPress={() => setReturnReason(reason.id)}
                  >
                    <MaterialCommunityIcons
                      name={reason.icon}
                      size={20}
                      color={returnReason === reason.id ? "#00A86B" : "#64748B"}
                    />
                    <Text
                      style={[
                        styles.reasonLabel,
                        returnReason === reason.id &&
                          styles.reasonLabelSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Additional Notes */}
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>
                  Additional Notes (Optional)
                </Text>
                <View style={styles.notesInput}>
                  {/* Using a placeholder since TextInput isn't shown */}
                  <Text style={styles.notesPlaceholder}>
                    {returnNotes || "Add any details about your return..."}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Button */}
        {selectedItem && returnReason && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.initiateButton,
                initiating && styles.buttonDisabled,
              ]}
              onPress={handleInitiateReturn}
              disabled={initiating}
            >
              {initiating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="qrcode"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.initiateButtonText}>
                    Generate Return QR
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  orderCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  orderDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  itemCardSelected: {
    borderColor: "#00A86B",
    backgroundColor: "#F0FDF4",
  },
  itemCardDisabled: {
    opacity: 0.5,
  },
  itemCheckbox: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: "#6B7280",
  },
  notEligible: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 4,
  },
  reasonsList: {
    gap: 10,
  },
  reasonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  reasonCardSelected: {
    borderColor: "#00A86B",
    backgroundColor: "#F0FDF4",
  },
  reasonLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  reasonLabelSelected: {
    color: "#00A86B",
    fontWeight: "600",
  },
  notesContainer: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 80,
  },
  notesPlaceholder: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  initiateButton: {
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  initiateButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
});

export default ReturnScreen;
