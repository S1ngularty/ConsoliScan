import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PersonalInfo, updateProfile } from "../../api/user.api";
import { useSelector, useDispatch } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import OfflineIndicator from "../../components/Common/OfflineIndicator";

const UserProfileScreen = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const dispatch = useDispatch();
  const userState = useSelector((state) => state.auth.user);
  const networkState = useSelector((state) => state.network);

  // Local state to trigger re-renders when network state changes
  const [isOffline, setIsOffline] = useState(false);
  const [isServerDown, setIsServerDown] = useState(false);

  // Sync with Redux network state
  useEffect(() => {
    setIsOffline(networkState.isOffline);
    setIsServerDown(networkState.isServerDown);
  }, [networkState.isOffline, networkState.isServerDown]);

  // Fetch user data
  useEffect(() => {
    if (!userState.userId) return;
    fetchUserData();
  }, [userState]);

  const fetchUserData = async () => {
    try {
      const result = await PersonalInfo(userState.userId);
      setUser(result);
      setEditedUser(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLastActive = () => {
    if (!user?.lastLogin) return "Recently";
    const lastLogin = new Date(user.lastLogin);
    const now = new Date();
    const diffHours = Math.floor((now - lastLogin) / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDate(user.lastLogin);
  };

  const handleEditProfile = () => {
    if (isEditing) {
      // Save changes
      saveProfileChanges();
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser(user); // Reset to original user data
  };

  const saveProfileChanges = async () => {
    try {
      setIsLoading(true);
      const updatedData = {
        name: editedUser.name,
        contactNumber: editedUser.contactNumber,
        age: editedUser.age,
        sex: editedUser.sex,
        street: editedUser.street,
        city: editedUser.city,
        state: editedUser.state,
        zipCode: editedUser.zipCode,
        country: editedUser.country,
      };

      const result = await updateProfile(userState.userId, updatedData);

      if (result) {
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeProfileImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access photos",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const response = await updateProfile(userState.userId, {
          avatar: {
            uri: result.assets[0].uri,
            name: result.assets[0].fileName,
            type: result.assets[0].type,
          },
        });

        if (!response) throw new Error("Failed to update profile image");
        setProfileImage(result.assets[0].uri);

        Alert.alert(
          "Profile Picture",
          "Profile picture selected. Save changes to update.",
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handleSecuritySettings = () => {
    navigation.navigate("SecuritySettings");
  };

  const handlePrivacySettings = () => {
    navigation.navigate("PrivacySettings");
  };

  const handleSupport = () => {
    navigation.navigate("Support");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () =>
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          }),
      },
    ]);
  };

  const renderEditableField = (
    label,
    value,
    fieldName,
    placeholder,
    keyboardType = "default",
  ) => {
    return (
      <View style={styles.infoItem}>
        <View style={styles.infoIconContainer}>
          <MaterialCommunityIcons
            name={getIconForField(fieldName)}
            size={20}
            color="#64748b"
          />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          {isEditing && !isConstantField(fieldName) ? (
            <TextInput
              style={styles.input}
              value={editedUser[fieldName] || ""}
              onChangeText={(text) =>
                setEditedUser({ ...editedUser, [fieldName]: text })
              }
              placeholder={placeholder}
              keyboardType={keyboardType}
            />
          ) : (
            <Text style={styles.infoValue}>{value || "Not provided"}</Text>
          )}
        </View>
      </View>
    );
  };

  const getIconForField = (fieldName) => {
    const icons = {
      name: "account",
      email: "email",
      contactNumber: "phone",
      age: "cake",
      sex: "gender-male-female",
      street: "home",
      city: "city",
      state: "map-marker",
      zipCode: "numeric",
      country: "earth",
    };
    return icons[fieldName] || "information";
  };

  const isConstantField = (fieldName) => {
    // Email and user ID are constant fields
    return ["email", "_id", "userId", "role", "status"].includes(fieldName);
  };

  const renderInfoItem = (
    icon,
    label,
    value,
    isEmail = false,
    isLoading = false,
  ) => {
    if (isLoading) {
      return (
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <MaterialCommunityIcons name={icon} size={20} color="#E2E8F0" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.skeletonText}></Text>
            <Text style={styles.skeletonText}></Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.infoItem}>
        <View style={styles.infoIconContainer}>
          <MaterialCommunityIcons name={icon} size={20} color="#64748b" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          {isEmail ? (
            <TouchableOpacity>
              <Text style={styles.infoValueLink}>{value}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.infoValue}>{value || "Not provided"}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderSettingItem = (
    icon,
    label,
    description,
    isToggle = false,
    value = false,
    onValueChange = null,
    isLoading = false,
  ) => {
    if (isLoading) {
      return (
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.skeletonIcon} />
            <View style={styles.settingContent}>
              <Text style={styles.skeletonText}></Text>
              <Text style={styles.skeletonText}></Text>
            </View>
          </View>
          {isToggle ? <View style={styles.skeletonSwitch} /> : null}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={!isToggle ? onValueChange : null}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIconContainer}>
            <MaterialCommunityIcons name={icon} size={22} color="#00A86B" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Text style={styles.settingDescription}>{description}</Text>
          </View>
        </View>
        {isToggle ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
            thumbColor={value ? "#00A86B" : "#94A3B8"}
          />
        ) : (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#CBD5E1"
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderActionItem = (icon, label, color, onPress, isLoading = false) => {
    if (isLoading) {
      return (
        <View style={styles.actionItem}>
          <View style={styles.skeletonIcon} />
          <Text style={styles.skeletonText}></Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#E2E8F0"
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.actionItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.actionIconContainer,
            { backgroundColor: color + "15" },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#CBD5E1"
        />
      </TouchableOpacity>
    );
  };

  // Loading State
  if (isLoading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.editButton} />
        </View>
        {isOffline || isServerDown ? (
          <OfflineIndicator message="Cannot load profile" />
        ) : (
          <ScrollView>
            <View style={styles.profileCard}>
              <View style={styles.skeletonCircle} />
              <View style={styles.skeletonTextContainer}>
                <Text style={styles.skeletonText}></Text>
                <Text style={styles.skeletonText}></Text>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // Show offline indicator if server is down (even after loading failed)
  if ((isOffline || isServerDown) && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.editButton} />
        </View>
        <OfflineIndicator message="Cannot load profile" />
      </SafeAreaView>
    );
  }

  // Loaded State
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <MaterialCommunityIcons
            name={isEditing ? "check" : "pencil"}
            size={20}
            color="#00A86B"
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar & Name */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handleChangeProfileImage}>
              <View style={styles.avatarContainer}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                  />
                ) : user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar.url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {getInitials(user?.name)}
                  </Text>
                )}
                <View style={styles.cameraIcon}>
                  <MaterialCommunityIcons
                    name="camera"
                    size={16}
                    color="#fff"
                  />
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.nameSection}>
              {isEditing ? (
                <TextInput
                  style={styles.nameInput}
                  value={editedUser?.name || ""}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, name: text })
                  }
                  placeholder="Full Name"
                />
              ) : (
                <Text style={styles.userName}>{user?.name}</Text>
              )}
              <Text style={styles.userRole}>
                {user?.role === "user" ? "Customer" : user?.role}
              </Text>
            </View>
          </View>

          {/* Change Profile Button */}
          <TouchableOpacity
            style={styles.changeProfileButton}
            onPress={handleChangeProfileImage}
          >
            <MaterialCommunityIcons
              name="image-edit"
              size={18}
              color="#00A86B"
            />
            <Text style={styles.changeProfileText}>Change Profile Picture</Text>
          </TouchableOpacity>

          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    user?.status === "active" ? "#00A86B" : "#FF6B6B",
                },
              ]}
            />
            <Text style={styles.statusText}>
              {user?.status === "active" ? "Active Account" : "Inactive"}
            </Text>
          </View>

          {/* Edit Mode Notice */}
          {isEditing && (
            <View style={styles.editNotice}>
              <MaterialCommunityIcons
                name="information"
                size={16}
                color="#00A86B"
              />
              <Text style={styles.editNoticeText}>
                Editing mode enabled. Tap check to save.
              </Text>
            </View>
          )}
        </View>

        {/* Personal Information Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* Constant Fields (Non-editable) */}
          {renderInfoItem("email", "Email", user?.email, true, false)}

          {/* Editable Fields */}
          {renderEditableField(
            "Phone",
            editedUser?.contactNumber,
            "contactNumber",
            "Enter phone number",
            "phone-pad",
          )}
          {renderEditableField(
            "Age",
            editedUser?.age ? `${editedUser.age} years old` : null,
            "age",
            "Enter age",
            "numeric",
          )}

          {/* Gender Selection */}
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <MaterialCommunityIcons
                name="gender-male-female"
                size={20}
                color="#64748b"
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              {isEditing ? (
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      editedUser?.sex === "male" && styles.genderButtonActive,
                    ]}
                    onPress={() =>
                      setEditedUser({ ...editedUser, sex: "male" })
                    }
                  >
                    <Text
                      style={[
                        styles.genderText,
                        editedUser?.sex === "male" && styles.genderTextActive,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      editedUser?.sex === "female" && styles.genderButtonActive,
                    ]}
                    onPress={() =>
                      setEditedUser({ ...editedUser, sex: "female" })
                    }
                  >
                    <Text
                      style={[
                        styles.genderText,
                        editedUser?.sex === "female" && styles.genderTextActive,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.infoValue}>
                  {user?.sex === "male" ? "Male" : "Female"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Address Fields */}
          {renderEditableField(
            "Street",
            editedUser?.street,
            "street",
            "Enter street address",
          )}
          {renderEditableField("City", editedUser?.city, "city", "Enter city")}
          {renderEditableField(
            "State",
            editedUser?.state,
            "state",
            "Enter state",
          )}
          {renderEditableField(
            "Zip Code",
            editedUser?.zipCode,
            "zipCode",
            "Enter zip code",
            "numeric",
          )}
          {renderEditableField(
            "Country",
            editedUser?.country,
            "country",
            "Enter country",
          )}
        </View>

        {/* Account Information Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          {renderInfoItem(
            "calendar",
            "Member Since",
            formatDate(user?.createdAt),
            false,
            false,
          )}
          {renderInfoItem(
            "clock-outline",
            "Last Active",
            getLastActive(),
            false,
            false,
          )}
          {renderInfoItem(
            "shield-check",
            "Status",
            user?.status === "active" ? "Verified" : "Pending",
            false,
            false,
          )}
        </View>

        {/* Settings Card */}
        {/* <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {renderSettingItem("bell", "Notifications", "Receive updates about your orders", true, notificationsEnabled, setNotificationsEnabled, false)}
          {renderSettingItem("fingerprint", "Biometric Login", "Use fingerprint or face ID", true, biometricsEnabled, setBiometricsEnabled, false)}
          {renderSettingItem("weather-night", "Dark Mode", "Use dark theme", true, darkMode, setDarkMode, false)}
        </View> */}

        {/* Actions Card */}
        {/* <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          {renderActionItem("lock", "Security Settings", "#3b82f6", handleSecuritySettings, false)}
          {renderActionItem("shield-lock", "Privacy Settings", "#8b5cf6", handlePrivacySettings, false)}
          {renderActionItem("help-circle", "Help & Support", "#f59e0b", handleSupport, false)}
        </View> */}

        {/* Cancel/Save Buttons in Edit Mode */}
        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>ConsoliScan v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 All rights reserved</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#00A86B",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  nameSection: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  userRole: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  changeProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  changeProfileText: {
    color: "#00A86B",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  editNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  editNoticeText: {
    fontSize: 13,
    color: "#00A86B",
    fontWeight: "500",
    flex: 1,
  },
  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  infoValueLink: {
    fontSize: 15,
    fontWeight: "600",
    color: "#00A86B",
  },
  input: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  genderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  genderButtonActive: {
    backgroundColor: "#00A86B",
    borderColor: "#00A86B",
  },
  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  genderTextActive: {
    color: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0, 168, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: "#666",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 4,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#00A86B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffebee",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f44336",
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: "center",
    paddingBottom: 30,
  },
  versionText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: "#999",
  },
  skeletonText: {
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    height: 16,
    marginVertical: 4,
  },
  skeletonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
  },
  skeletonTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },
  skeletonSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
});

export default UserProfileScreen;
