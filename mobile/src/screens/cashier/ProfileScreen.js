import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { getProfile, updateProfile } from "../../api/cashier.api";
import OfflineIndicator from "../../components/Common/OfflineIndicator";

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const networkState = useSelector((state) => state.network);

  // Local state to trigger re-renders when network state changes
  const [isOffline, setIsOffline] = useState(false);
  const [isServerDown, setIsServerDown] = useState(false);

  // Sync with Redux network state
  useEffect(() => {
    setIsOffline(networkState.isOffline);
    setIsServerDown(networkState.isServerDown);
  }, [networkState.isOffline, networkState.isServerDown]);

  // Edit form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    address: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    avatar: null,
  });

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, []),
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      console.log("Profile data:", data);
      setProfile(data.user);
      setStats(data.stats);

      // Initialize form data
      setFormData({
        name: data.user.name || "",
        email: data.user.email || "",
        contactNumber: data.user.contactNumber || "",
        address: data.user.address || "",
        street: data.user.street || "",
        city: data.user.city || "",
        state: data.user.state || "",
        zipCode: data.user.zipCode || "",
        avatar: null,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({
        ...formData,
        avatar: {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "avatar.jpg",
        },
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Prepare data (only send changed fields)
      const updateData = {};
      if (formData.name !== profile.name) updateData.name = formData.name;
      if (formData.email !== profile.email) updateData.email = formData.email;
      if (formData.contactNumber !== profile.contactNumber)
        updateData.contactNumber = formData.contactNumber;
      if (formData.address !== profile.address)
        updateData.address = formData.address;
      if (formData.street !== profile.street)
        updateData.street = formData.street;
      if (formData.city !== profile.city) updateData.city = formData.city;
      if (formData.state !== profile.state) updateData.state = formData.state;
      if (formData.zipCode !== profile.zipCode)
        updateData.zipCode = formData.zipCode;
      if (formData.avatar) updateData.avatar = formData.avatar;

      if (Object.keys(updateData).length === 0) {
        Alert.alert("No Changes", "No changes to save");
        setEditMode(false);
        return;
      }

      await updateProfile(updateData);
      Alert.alert("Success", "Profile updated successfully");
      setEditMode(false);
      await fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}
          >
            <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        {isOffline || isServerDown ? (
          <OfflineIndicator />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00A86B" />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Show offline indicator if server is down (even after loading failed)
  if (isOffline || isServerDown) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}
          >
            <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <OfflineIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.headerRight}>
          {!editMode ? (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <MaterialCommunityIcons name="pencil" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setEditMode(false)}>
              <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={editMode ? pickImage : null}
            disabled={!editMode}
          >
            {formData.avatar?.uri ? (
              <Image
                source={{ uri: formData.avatar.uri }}
                style={styles.avatarImage}
              />
            ) : profile?.avatar?.url ? (
              <Image
                source={{ uri: profile.avatar.url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.profileAvatar}>
                <MaterialCommunityIcons
                  name="account"
                  size={60}
                  color="#FFFFFF"
                />
              </View>
            )}
            {editMode && (
              <View style={styles.cameraIconContainer}>
                <MaterialCommunityIcons
                  name="camera"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            )}
          </TouchableOpacity>

          {!editMode ? (
            <>
              <Text style={styles.profileName}>{profile?.name}</Text>
              <Text style={styles.profileRole}>
                {profile?.role === "checker" ? "Cashier" : profile?.role}
              </Text>
            </>
          ) : (
            <TextInput
              style={styles.nameInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Full Name"
            />
          )}
        </View>

        {/* Account Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="email-outline"
              size={22}
              color="#64748B"
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              {!editMode ? (
                <Text style={styles.infoValue}>{profile?.email || "N/A"}</Text>
              ) : (
                <TextInput
                  style={styles.infoInput}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={22}
              color="#64748B"
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              {!editMode ? (
                <Text style={styles.infoValue}>
                  {profile?.contactNumber || "N/A"}
                </Text>
              ) : (
                <TextInput
                  style={styles.infoInput}
                  value={formData.contactNumber}
                  onChangeText={(text) =>
                    setFormData({ ...formData, contactNumber: text })
                  }
                  keyboardType="phone-pad"
                />
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="calendar-outline"
              size={22}
              color="#64748B"
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>
                {formatDate(profile?.joinedDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Address Section */}
        {editMode && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Address (Optional)</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Street</Text>
              <TextInput
                style={styles.formInput}
                value={formData.street}
                onChangeText={(text) =>
                  setFormData({ ...formData, street: text })
                }
                placeholder="Street address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>City</Text>
              <TextInput
                style={styles.formInput}
                value={formData.city}
                onChangeText={(text) =>
                  setFormData({ ...formData, city: text })
                }
                placeholder="City"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>State/Province</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.state}
                  onChangeText={(text) =>
                    setFormData({ ...formData, state: text })
                  }
                  placeholder="State"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Zip Code</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.zipCode}
                  onChangeText={(text) =>
                    setFormData({ ...formData, zipCode: text })
                  }
                  placeholder="Zip"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* Performance Stats */}
        {!editMode && stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Performance</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalTransactions}</Text>
                <Text style={styles.statLabel}>Total Transactions</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  ₱{stats.totalSales.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Sales</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.todayTransactions}</Text>
                <Text style={styles.statLabel}>Today's Trans.</Text>
              </View>
            </View>
          </View>
        )}

        {/* Save Button */}
        {editMode && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="content-save"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#00A86B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  menuButton: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  headerRight: { padding: 8, width: 44 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1 },
  profileHeader: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  avatarContainer: { position: "relative", marginBottom: 16 },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#00A86B",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  profileRole: { fontSize: 16, color: "#64748B", textTransform: "capitalize" },
  nameInput: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    width: "100%",
    textAlign: "center",
  },
  infoSection: { backgroundColor: "#FFFFFF", padding: 20, marginBottom: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoContent: { marginLeft: 12, flex: 1 },
  infoLabel: { fontSize: 13, color: "#64748B", marginBottom: 2 },
  infoValue: { fontSize: 15, color: "#1E293B", fontWeight: "500" },
  infoInput: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: "row" },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 6,
  },
  formInput: {
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  statsSection: { backgroundColor: "#FFFFFF", padding: 20, marginBottom: 20 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00A86B",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#64748B", textAlign: "center" },
  buttonContainer: { padding: 20, paddingBottom: 30 },
  saveButton: {
    backgroundColor: "#00A86B",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});

export default ProfileScreen;
