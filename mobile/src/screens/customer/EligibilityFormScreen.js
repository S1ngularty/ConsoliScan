import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import * as Haptics from "expo-haptics";
import { ApplyEligibility } from "../../api/user.api";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#00A86B",
  primaryDark: "#007A4D",
  primaryLight: "#E8F8F2",
  white: "#FFFFFF",
  black: "#0A0A0A",
  gray100: "#F7F8FA",
  gray200: "#EBEBEB",
  gray300: "#D1D5DB",
  gray500: "#9CA3AF",
  gray700: "#4B5563",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  warning: "#F59E0B",
  warningLight: "#FFFBF0",
  info: "#3B82F6",
  infoLight: "#EFF6FF",
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <View style={[cardS.card, style]}>{children}</View>
);
const cardS = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});

// ─── Field Label ──────────────────────────────────────────────────────────────
const FieldLabel = ({ children, required }) => (
  <Text style={fieldS.label}>
    {children}
    {required && <Text style={fieldS.required}> *</Text>}
  </Text>
);
const fieldS = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray700,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  required: { color: COLORS.danger },
});

// ─── Disability Option ────────────────────────────────────────────────────────
const disabilityOptions = [
  { id: "visual", label: "Visual Impairment", icon: "eye-off-outline" },
  { id: "hearing", label: "Hearing Impairment", icon: "ear-hearing-off" },
  {
    id: "physical",
    label: "Physical Disability",
    icon: "wheelchair-accessibility",
  },
  { id: "mental", label: "Mental Disability", icon: "brain" },
  { id: "multiple", label: "Multiple Disabilities", icon: "human" },
];

// ─── Main Form Screen ─────────────────────────────────────────────────────────
const EligibilityFormScreen = ({ navigation, route }) => {
  const { idType, images } = route.params;
  const user = useSelector((state) => state.auth.user);
//   console.log(images);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [formData, setFormData] = useState({
    idNumber: "",
    idType,
    dateIssued: new Date(),
    expiryDate: idType === "senior" ? null : new Date(),
    typeOfDisability: idType === "pwd" ? "" : null,
  });
  const [showDateIssuedPicker, setShowDateIssuedPicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const isPwd = idType === "pwd";

  const handleDateChange = (event, selectedDate, type) => {
    const current =
      selectedDate ||
      (type === "dateIssued" ? formData.dateIssued : formData.expiryDate);
    if (type === "dateIssued") {
      setShowDateIssuedPicker(false);
      setFormData({ ...formData, dateIssued: current });
    } else {
      setShowExpiryDatePicker(false);
      setFormData({ ...formData, expiryDate: current });
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const validateForm = () => {
    if (!formData.idNumber.trim()) {
      Alert.alert("Missing Field", "Please enter your ID number.");
      return false;
    }
    if (isPwd && !formData.typeOfDisability) {
      Alert.alert("Missing Field", "Please select your type of disability.");
      return false;
    }
    if (formData.expiryDate && formData.expiryDate <= formData.dateIssued) {
      Alert.alert(
        "Invalid Dates",
        "Expiry date must be after the date issued.",
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const data = new FormData();
      data.append("idNumber", formData.idNumber);
      data.append("idType", formData.idType);
      data.append(
        "dateIssued",
        formData.dateIssued.toISOString().split("T")[0],
      );

      if (isPwd) {
        data.append(
          "expiryDate",
          formData.expiryDate.toISOString().split("T")[0],
        );
        data.append("typeOfDisability", formData.typeOfDisability);
      }

      if (images.idFront)
        data.append("idFront", {
          uri: images.idFront,
          type: "image/jpeg",
          name: "id_front.jpg",
        });
      if (images.idBack)
        data.append("idBack", {
          uri: images.idBack,
          type: "image/jpeg",
          name: "id_back.jpg",
        });
      if (images.selfie)
        data.append("userPhoto", {
          uri: images.selfie,
          type: "image/jpeg",
          name: "selfie.jpg",
        });
    //   console.table(data);
    //   return;
      await ApplyEligibility(user.userId, data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Application Submitted ✓",
        "Your application has been received. Our team will review it within 1–3 business days.",
        [
          {
            text: "Done",
            onPress: () => navigation.navigate("EligibilityStatus"),
          },
        ],
      );
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Submission Failed",
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const idLabel = isPwd ? "PWD" : "Senior Citizen";

  return (
    <SafeAreaView style={s.container}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={COLORS.black}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{idLabel} Information</Text>
          <Text style={s.headerSub}>Step 4 of 4 — Final details</Text>
        </View>
      </View>

      {/* ── Progress Bar ───────────────────────────────────────────────────── */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: "100%" }]} />
      </View>

      {/* ── Form ───────────────────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro Card */}
        <Card
          style={{
            backgroundColor: COLORS.primaryLight,
            borderWidth: 1,
            borderColor: "#B2E8D4",
          }}
        >
          <View
            style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
          >
            <View style={s.introIconWrap}>
              <MaterialCommunityIcons
                name={isPwd ? "wheelchair-accessibility" : "account-heart"}
                size={22}
                color={COLORS.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.introTitle}>Almost there!</Text>
              <Text style={s.introText}>
                Enter your {idLabel} ID details below. Make sure they match the
                information on your card exactly.
              </Text>
            </View>
          </View>
        </Card>

        {/* ID Number */}
        <Card>
          <Text style={s.cardSectionTitle}>ID Details</Text>

          <View style={s.fieldGroup}>
            <FieldLabel required>{idLabel} ID Number</FieldLabel>
            <View
              style={[
                s.inputWrap,
                focusedField === "idNumber" && s.inputWrapFocused,
              ]}
            >
              <MaterialCommunityIcons
                name="card-account-details-outline"
                size={18}
                color={
                  focusedField === "idNumber" ? COLORS.primary : COLORS.gray500
                }
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={s.input}
                value={formData.idNumber}
                onChangeText={(t) => setFormData({ ...formData, idNumber: t })}
                placeholder={`e.g. ${isPwd ? "PWD-2024-000001" : "SC-2024-000001"}`}
                placeholderTextColor={COLORS.gray300}
                autoCapitalize="characters"
                onFocus={() => setFocusedField("idNumber")}
                onBlur={() => setFocusedField(null)}
              />
              {formData.idNumber.length > 0 && (
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, idNumber: "" })}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={16}
                    color={COLORS.gray300}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Date Issued */}
          <View style={s.fieldGroup}>
            <FieldLabel required>Date Issued</FieldLabel>
            <TouchableOpacity
              style={s.dateBtn}
              onPress={() => setShowDateIssuedPicker(true)}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={s.dateBtnText}>
                {formatDate(formData.dateIssued)}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={COLORS.gray500}
              />
            </TouchableOpacity>
            {showDateIssuedPicker && (
              <DateTimePicker
                value={formData.dateIssued}
                mode="date"
                display="default"
                onChange={(e, d) => handleDateChange(e, d, "dateIssued")}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Expiry Date — PWD only */}
          {isPwd && (
            <View style={[s.fieldGroup, { marginBottom: 0 }]}>
              <FieldLabel>Expiry Date</FieldLabel>
              <TouchableOpacity
                style={s.dateBtn}
                onPress={() => setShowExpiryDatePicker(true)}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name="calendar-clock-outline"
                  size={18}
                  color={COLORS.gray500}
                />
                <Text
                  style={[
                    s.dateBtnText,
                    {
                      color: formData.expiryDate
                        ? COLORS.black
                        : COLORS.gray500,
                    },
                  ]}
                >
                  {formatDate(formData.expiryDate)}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={COLORS.gray500}
                />
              </TouchableOpacity>
              {showExpiryDatePicker && (
                <DateTimePicker
                  value={formData.expiryDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(e, d) => handleDateChange(e, d, "expiryDate")}
                  minimumDate={formData.dateIssued}
                />
              )}
            </View>
          )}
        </Card>

        {/* Disability Type — PWD only */}
        {isPwd && (
          <Card>
            <Text style={s.cardSectionTitle}>
              Disability Type <Text style={{ color: COLORS.danger }}>*</Text>
            </Text>
            <Text style={s.cardSectionSub}>
              Select the option that best describes your condition.
            </Text>

            <View style={{ gap: 10, marginTop: 4 }}>
              {disabilityOptions.map((opt) => {
                const selected = formData.typeOfDisability === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      s.disabilityOption,
                      selected && s.disabilityOptionActive,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, typeOfDisability: opt.id });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    disabled={loading}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        s.disabilityIconWrap,
                        selected && s.disabilityIconWrapActive,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon}
                        size={18}
                        color={selected ? "#fff" : COLORS.gray500}
                      />
                    </View>
                    <Text
                      style={[
                        s.disabilityLabel,
                        selected && s.disabilityLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {selected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={COLORS.primary}
                        style={{ marginLeft: "auto" }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={18}
            color={COLORS.info}
          />
          <Text style={s.disclaimerText}>
            By submitting, you confirm that all provided information is accurate
            and authentic. False information may result in application
            rejection.
          </Text>
        </View>
      </ScrollView>

      {/* ── Submit Button ───────────────────────────────────────────────────── */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.65 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="send-check-outline"
                size={20}
                color="#fff"
              />
              <Text style={s.submitBtnText}>Submit Application</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray100 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.black },
  headerSub: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },

  progressTrack: {
    height: 3,
    backgroundColor: COLORS.gray200,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  scroll: { flex: 1 },

  // Intro card
  introIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B2E8D4",
  },
  introTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  introText: { fontSize: 13, color: COLORS.gray700, lineHeight: 19 },

  // Card sections
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 4,
  },
  cardSectionSub: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: 14,
    lineHeight: 18,
  },

  // Field groups
  fieldGroup: { marginBottom: 16 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.black,
    padding: 0,
  },

  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    gap: 10,
  },
  dateBtnText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.black,
    fontWeight: "500",
  },

  // Disability options
  disabilityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.gray100,
    gap: 12,
  },
  disabilityOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  disabilityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  disabilityIconWrapActive: {
    backgroundColor: COLORS.primary,
  },
  disabilityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray700,
  },
  disabilityLabelActive: {
    color: COLORS.primaryDark,
    fontWeight: "700",
  },

  // Disclaimer
  disclaimer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: COLORS.infoLight,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: "#1D4ED8",
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
});

export default EligibilityFormScreen;
