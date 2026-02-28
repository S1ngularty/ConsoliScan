import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { completeInspection } from "../../api/return.api";

const ReturnInspectionScreen = ({ navigation, route }) => {
  const { returnId, order, item } = route.params;
  const parsedPrice = Number(item?.price);
  const safePrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;
  const parsedQuantity = Number(item?.quantity);
  const safeQuantity =
    Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;

  const [inspectionStatus, setInspectionStatus] = useState(null); // "PASSED" or "REJECTED"
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));

  const inspectionChecks = [
    {
      id: "packaging",
      title: "Packaging Condition",
      description: "Check if original packaging is intact",
    },
    {
      id: "seal",
      title: "Seal / Tags",
      description: "Check if seals and tags are present",
    },
    {
      id: "functionality",
      title: "Functionality",
      description: "Test if item works properly",
    },
    {
      id: "defects",
      title: "Physical Defects",
      description: "Check for scratches, dents, or damage",
    },
    {
      id: "accessories",
      title: "Accessories",
      description: "Verify all original accessories included",
    },
  ];

  const rejectionReasons = [
    "Item opened / unsealed",
    "Missing accessories",
    "Physical damage",
    "Not working properly",
    "Worn / used condition",
    "Other",
  ];

  const handleSubmitInspection = async () => {
    if (!inspectionStatus) {
      Alert.alert(
        "Error",
        "Please select inspection status (PASSED or REJECTED)",
      );
      return;
    }

    if (inspectionStatus === "REJECTED" && !rejectionReason) {
      Alert.alert("Error", "Please select a rejection reason");
      return;
    }

    setIsSubmitting(true);

    try {
      await completeInspection(returnId, {
        inspectionStatus: inspectionStatus,
        inspectionNotes: inspectionStatus === "REJECTED" ? rejectionReason : "",
      });

      if (inspectionStatus === "REJECTED") {
        Alert.alert("Return Rejected", `Item rejected: ${rejectionReason}`, [
          {
            text: "Back to Returns",
            onPress: () => navigation.popToTop(),
          },
        ]);
      } else {
        // Item passed inspection, move to fulfillment screen
        navigation.navigate("ReturnFulfillment", {
          returnId: returnId,
          order: order,
          item: item,
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspect Item</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* Item Info Card */}
        <View style={styles.section}>
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemSubtext}>
                Qty: {safeQuantity} × ₱{safePrice.toFixed(2)}
              </Text>
              <Text style={styles.itemSubtext}>
                Return ID: {returnId.substring(0, 8)}...
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "#FEF08A" }]}>
              <MaterialCommunityIcons
                name="clipboard-check"
                size={20}
                color="#B45309"
              />
            </View>
          </View>
        </View>

        {/* Reason Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Return Reason</Text>
          <View style={styles.reasonCard}>
            <Text style={styles.reasonText}>{item.reason}</Text>
            {item.notes && (
              <Text style={styles.reasonNotes}>Notes: {item.notes}</Text>
            )}
          </View>
        </View>

        {/* Inspection Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inspection Checklist</Text>
          <Text style={styles.sectionSubtitle}>
            Review these points before making a decision
          </Text>

          <View style={styles.checklistContainer}>
            {inspectionChecks.map((check, idx) => (
              <View key={check.id} style={styles.checklistItem}>
                <View style={styles.checklistIconContainer}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color="#10B981"
                  />
                </View>
                <View style={styles.checklistTextContainer}>
                  <Text style={styles.checklistItemTitle}>{check.title}</Text>
                  <Text style={styles.checklistItemDescription}>
                    {check.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Inspection Decision */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inspection Decision</Text>

          {/* Pass Button */}
          <TouchableOpacity
            style={[
              styles.decisionButton,
              styles.passButton,
              inspectionStatus === "PASSED" && styles.decisionButtonActive,
            ]}
            onPress={() => {
              setInspectionStatus("PASSED");
              setRejectionReason("");
            }}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={24}
              color={inspectionStatus === "PASSED" ? "#10B981" : "#6B7280"}
            />
            <View style={styles.decisionTextContainer}>
              <Text
                style={[
                  styles.decisionTitle,
                  inspectionStatus === "PASSED" && styles.decisionTitleActive,
                ]}
              >
                Item Passed Inspection
              </Text>
              <Text style={styles.decisionSubtitle}>
                Item is in acceptable condition
              </Text>
            </View>
            <MaterialCommunityIcons
              name={
                inspectionStatus === "PASSED"
                  ? "radiobox-marked"
                  : "radiobox-blank"
              }
              size={24}
              color={inspectionStatus === "PASSED" ? "#10B981" : "#D1D5DB"}
            />
          </TouchableOpacity>

          {/* Reject Button */}
          <TouchableOpacity
            style={[
              styles.decisionButton,
              styles.rejectButton,
              inspectionStatus === "REJECTED" && styles.decisionButtonActive,
            ]}
            onPress={() => setInspectionStatus("REJECTED")}
          >
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={24}
              color={inspectionStatus === "REJECTED" ? "#EF4444" : "#6B7280"}
            />
            <View style={styles.decisionTextContainer}>
              <Text
                style={[
                  styles.decisionTitle,
                  inspectionStatus === "REJECTED" && styles.decisionTitleActive,
                ]}
              >
                Item Failed Inspection
              </Text>
              <Text style={styles.decisionSubtitle}>
                Item doesn't meet return standards
              </Text>
            </View>
            <MaterialCommunityIcons
              name={
                inspectionStatus === "REJECTED"
                  ? "radiobox-marked"
                  : "radiobox-blank"
              }
              size={24}
              color={inspectionStatus === "REJECTED" ? "#EF4444" : "#D1D5DB"}
            />
          </TouchableOpacity>

          {/* Rejection Reason */}
          {inspectionStatus === "REJECTED" && (
            <View style={styles.rejectionReasonContainer}>
              <Text style={styles.rejectionReasonTitle}>
                Reason for Rejection
              </Text>
              {rejectionReasons.map((reason, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.reasonOption,
                    rejectionReason === reason && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setRejectionReason(reason)}
                >
                  <MaterialCommunityIcons
                    name={
                      rejectionReason === reason
                        ? "checkbox-marked"
                        : "checkbox-blank-outline"
                    }
                    size={20}
                    color={rejectionReason === reason ? "#EF4444" : "#D1D5DB"}
                  />
                  <Text
                    style={[
                      styles.reasonOptionText,
                      rejectionReason === reason &&
                        styles.reasonOptionTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !inspectionStatus && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitInspection}
            disabled={!inspectionStatus || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {inspectionStatus === "REJECTED"
                    ? "Reject Return"
                    : "Item Passed - Proceed"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  itemSubtext: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  reasonCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  reasonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 4,
  },
  reasonNotes: {
    fontSize: 12,
    color: "#1E40AF",
    fontStyle: "italic",
  },
  checklistContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  checklistItem_last: {
    borderBottomWidth: 0,
  },
  checklistIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checklistTextContainer: {
    flex: 1,
  },
  checklistItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  checklistItemDescription: {
    fontSize: 12,
    color: "#6B7280",
  },
  decisionButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  passButton: {
    borderColor: "#D1FAE5",
  },
  rejectButton: {
    borderColor: "#FEE2E2",
  },
  decisionButtonActive: {
    backgroundColor: "#F0FDF4",
  },
  decisionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  decisionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 2,
  },
  decisionTitleActive: {
    color: "#1E293B",
  },
  decisionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  rejectionReasonContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  rejectionReasonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#FEF2F2",
  },
  reasonOptionSelected: {
    backgroundColor: "#FEE2E2",
  },
  reasonOptionText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 12,
    flex: 1,
  },
  reasonOptionTextSelected: {
    color: "#1E293B",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "center",
  },
});

export default ReturnInspectionScreen;
