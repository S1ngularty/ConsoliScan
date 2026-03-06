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
import { updateProduct, updateProductStock } from "../../api/product.api";
import { getCategories } from "../../api/category.api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../utils/authUtil";

const { width } = Dimensions.get("window");

export default function ProductEditScreen({ route, navigation }) {
  const { product } = route.params;

  const [formData, setFormData] = useState({
    name: product.name || "",
    price: product.price?.toString() || "",
    stockQuantity: product.stockQuantity?.toString() || "",
    description: product.description || "",
    unit: product.unit || "pc",
    salePrice: product.salePrice?.toString() || "",
    saleActive: product.saleActive || false,
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(
    product.category?._id || product.category || "",
  );
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    fetchCategories();
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Error", "Product name is required");
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
      const updateData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        description: formData.description.trim(),
        unit: formData.unit,
        category: selectedCategory,
      };

      // Add sale price if active
      if (formData.saleActive && formData.salePrice) {
        updateData.salePrice = parseFloat(formData.salePrice);
        updateData.saleActive = true;
      } else {
        updateData.saleActive = false;
        updateData.salePrice = null;
      }

      await updateProduct(product._id, updateData, token);

      // Update stats
      await incrementStat("productsUpdated");

      Alert.alert("Success", "Product updated successfully", [
        {
          text: "OK",
          onPress: () => navigation.navigate("MerchandiserHome"),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update product");
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
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Product Image */}
        {product.images && product.images.length > 0 && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.images[0].url }}
              style={styles.productImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Product Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Information</Text>

          {/* Barcode (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barcode</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{product.barcode}</Text>
              <MaterialCommunityIcons name="lock" size={20} color="#999" />
            </View>
          </View>

          {/* SKU (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKU</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{product.sku}</Text>
              <MaterialCommunityIcons name="lock" size={20} color="#999" />
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

        {/* Pricing Card */}
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
              <MaterialIcons name="save" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Update Product</Text>
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
  imageContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    elevation: 2,
  },
  productImage: {
    width: width * 0.6,
    height: width * 0.6,
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
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  readOnlyText: {
    fontSize: 16,
    color: "#666",
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
    justifyContent: "space-between",
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
