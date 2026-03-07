import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { createProduct } from "../../api/product.api";
import { getCategories } from "../../api/category.api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../utils/authUtil";

const { width } = Dimensions.get("window");

export default function ProductAddScreen({ route, navigation }) {
  const { barcode } = route.params;

  const [formData, setFormData] = useState({
    name: "",
    barcode: barcode || "",
    barcodeType: "EAN_13",
    sku: "",
    description: "",
    price: "",
    stockQuantity: "",
    unit: "pc",
    salePrice: "",
    saleActive: false,
    excludedFromDiscount: false,
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    fetchCategories();
    generateSKU();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      Alert.alert("Error", "Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const generateSKU = () => {
    // Generate a simple SKU based on timestamp
    const sku = `SKU${Date.now()}`;
    handleInputChange("sku", sku);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can only upload up to 5 images");
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) => [...prev, result.assets[0]]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }
    if (!formData.barcode.trim()) {
      Alert.alert("Error", "Barcode is required");
      return;
    }
    if (!formData.sku.trim()) {
      Alert.alert("Error", "SKU is required");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert("Error", "Valid price is required");
      return;
    }
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      Alert.alert("Error", "Valid stock quantity is required");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const productData = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim(),
        barcodeType: formData.barcodeType,
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        unit: formData.unit,
        category: selectedCategory,
        excludedFromDiscount: formData.excludedFromDiscount,
        images: images,
      };

      // Add sale price if active
      if (formData.saleActive && formData.salePrice) {
        productData.salePrice = parseFloat(formData.salePrice);
        productData.saleActive = true;
      }

      await createProduct(productData, token);

      // Update stats
      await incrementStat("productsAdded");

      Alert.alert("Success", "Product added successfully", [
        {
          text: "OK",
          onPress: () => navigation.navigate("MerchandiserHome"),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const incrementStat = async (stat) => {
    try {
      const statsData = await AsyncStorage.getItem("merchandiserStats");
      const stats = statsData
        ? JSON.parse(statsData)
        : {
            productsScanned: 0,
            productsUpdated: 0,
            productsAdded: 0,
          };
      stats[stat] = (stats[stat] || 0) + 1;
      await AsyncStorage.setItem("merchandiserStats", JSON.stringify(stats));
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  if (loadingCategories) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Images Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Images (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <MaterialIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handlePickImage}
              >
                <MaterialIcons name="add-a-photo" size={32} color="#999" />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Basic Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>

          {/* Barcode */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barcode *</Text>
            <TextInput
              style={styles.input}
              value={formData.barcode}
              onChangeText={(value) => handleInputChange("barcode", value)}
              placeholder="Enter barcode"
              keyboardType="numeric"
            />
          </View>

          {/* Barcode Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barcode Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.barcodeType}
                onValueChange={(value) =>
                  handleInputChange("barcodeType", value)
                }
                style={styles.picker}
              >
                <Picker.Item label="EAN-13" value="EAN_13" />
                <Picker.Item label="EAN-8" value="EAN_8" />
                <Picker.Item label="UPC" value="UPC" />
                <Picker.Item label="CODE-128" value="CODE_128" />
                <Picker.Item label="QR" value="QR" />
                <Picker.Item label="ISBN-10" value="ISBN_10" />
                <Picker.Item label="ISBN-13" value="ISBN_13" />
              </Picker>
            </View>
          </View>

          {/* SKU */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKU *</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={formData.sku}
                onChangeText={(value) => handleInputChange("sku", value)}
                placeholder="Enter SKU"
              />
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateSKU}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={24}
                  color="#2E7D32"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              placeholder="Enter product name"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              placeholder="Enter product description"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
                style={styles.picker}
              >
                <Picker.Item label="Select category" value="" />
                {categories.map((category) => (
                  <Picker.Item
                    key={category._id}
                    label={category.categoryName}
                    value={category._id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Pricing & Stock */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing & Stock</Text>

          {/* Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(value) => handleInputChange("price", value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Stock Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stock Quantity *</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                value={formData.stockQuantity}
                onChangeText={(value) =>
                  handleInputChange("stockQuantity", value)
                }
                placeholder="0"
                keyboardType="numeric"
              />
              <View style={[styles.pickerContainer, { flex: 1 }]}>
                <Picker
                  selectedValue={formData.unit}
                  onValueChange={(value) => handleInputChange("unit", value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Piece" value="pc" />
                  <Picker.Item label="Kilogram" value="kg" />
                  <Picker.Item label="Gram" value="g" />
                  <Picker.Item label="Liter" value="liter" />
                  <Picker.Item label="Milliliter" value="ml" />
                  <Picker.Item label="Pack" value="pack" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Sale Price */}
          <View style={styles.inputGroup}>
            <View style={styles.row}>
              <Text style={styles.label}>Sale Price</Text>
              <TouchableOpacity
                style={styles.saleToggle}
                onPress={() =>
                  handleInputChange("saleActive", !formData.saleActive)
                }
              >
                <MaterialIcons
                  name={
                    formData.saleActive
                      ? "check-box"
                      : "check-box-outline-blank"
                  }
                  size={24}
                  color={formData.saleActive ? "#2E7D32" : "#999"}
                />
                <Text style={styles.saleToggleText}>Active</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                !formData.saleActive && styles.inputDisabled,
              ]}
              value={formData.salePrice}
              onChangeText={(value) => handleInputChange("salePrice", value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={formData.saleActive}
            />
          </View>

          {/* Excluded from Discount */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              handleInputChange(
                "excludedFromDiscount",
                !formData.excludedFromDiscount,
              )
            }
          >
            <MaterialIcons
              name={
                formData.excludedFromDiscount
                  ? "check-box"
                  : "check-box-outline-blank"
              }
              size={24}
              color={formData.excludedFromDiscount ? "#2E7D32" : "#999"}
            />
            <Text style={styles.checkboxText}>Exclude from discounts</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="add-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Add Product</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#2E7D32",
    elevation: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#f44336",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  generateButton: {
    marginLeft: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderRadius: 8,
  },
  saleToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  saleToggleText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  checkboxText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
