# Merchandiser Role Implementation Guide

## Overview

This document describes the new **Merchandiser** role added to the ConsoliScan mobile application. Merchandisers can scan products, update existing product information, and add new products to the inventory system.

## Features

### 1. Simple Home Dashboard

- Greeting with current time
- Quick scan action button
- Daily activity statistics (scanned, updated, added products)
- Usage instructions
- Offline indicator
- Logout functionality

### 2. Product Scanning

- Camera-based barcode scanning
- Manual barcode entry option
- Supports multiple barcode types:
  - EAN-13, EAN-8
  - UPC
  - CODE-128
  - QR codes
  - ISBN-10, ISBN-13
- Real-time product lookup
- Automatic routing based on scan result

### 3. Product Editing (Existing Products)

- Update product information:
  - Name and description
  - Category selection
  - Price and sale price
  - Stock quantity with units (pc, kg, g, liter, ml, pack)
  - Sale activation toggle
- View-only fields:
  - Barcode (locked)
  - SKU (locked)
- Image display for existing products
- Form validation
- Success/error feedback

### 4. Product Adding (New Products)

- Complete product form:
  - Barcode and barcode type
  - Auto-generated SKU (with manual override)
  - Product name and description
  - Category selection
  - Pricing (regular and sale)
  - Stock quantity with unit selection
  - Discount exclusion toggle
  - Image upload (up to 5 images)
- Image management:
  - Pick from library
  - Preview before upload
  - Remove images
- Form validation
- Success/error feedback

### 5. Activity Tracking

- Local statistics stored in AsyncStorage
- Tracks daily metrics:
  - Products scanned
  - Products updated
  - Products added
- Persists across app sessions

## File Structure

```
mobile/src/
├── api/
│   ├── category.api.js          # NEW: Category fetching
│   └── product.api.js           # UPDATED: Add createProduct, updateProduct, updateProductStock
├── navigation/
│   ├── MerchandiserStackNavigator.js  # NEW: Merchandiser navigation
│   └── RootStackNavigator.js    # UPDATED: Add merchandiser routing
└── screens/
    └── merchandiser/            # NEW: All merchandiser screens
        ├── MerchandiserHomeScreen.js
        ├── ProductScanScreen.js
        ├── ProductEditScreen.js
        └── ProductAddScreen.js

backend/models/
└── userModel.js                 # UPDATED: Add "merchandiser" to role enum
```

## Backend Changes

### User Model (`backend/models/userModel.js`)

Added `"merchandiser"` to the role enum:

```javascript
role: {
  type: String,
  default: "user",
  enum: ["user", "admin", "super_admin", "checker", "merchandiser"],
}
```

## API Endpoints Used

### Product APIs

- `GET /api/v1/scan/product` - Scan and retrieve product by barcode
- `POST /api/v1/product` - Create new product
- `PUT /api/v1/product/:productId` - Update existing product
- `PUT /api/v1/product/stocks/:productId` - Update stock quantity
- `GET /api/v1/catalog` - Fetch all products

### Category APIs

- `GET /api/v1/category` - Fetch all categories

## Installation Requirements

### Dependencies

Ensure these packages are installed in your mobile app:

```bash
cd mobile
npm install @react-native-picker/picker
npm install expo-image-picker
npm install @react-native-async-storage/async-storage
npm install expo-camera
```

Or using Expo:

```bash
npx expo install @react-native-picker/picker expo-image-picker expo-camera @react-native-async-storage/async-storage
```

## Creating a Merchandiser User

### Method 1: Database Direct

Update an existing user in MongoDB:

```javascript
db.users.updateOne(
  { email: "merchandiser@example.com" },
  { $set: { role: "merchandiser" } },
);
```

### Method 2: Admin Dashboard

If you have an admin panel, add a user management interface to assign the "merchandiser" role.

### Method 3: Registration with Role

Update your registration API to allow role selection (admin-only feature).

## Usage Flow

### For Existing Products:

1. Open app → Login as merchandiser
2. Tap "Scan Product" on home screen
3. Scan barcode or enter manually
4. Product found → Edit screen opens
5. Update fields (price, stock, etc.)
6. Tap "Update Product"
7. Success → Return to home

### For New Products:

1. Open app → Login as merchandiser
2. Tap "Scan Product" on home screen
3. Scan barcode or enter manually
4. Product not found → Alert appears
5. Tap "Add Product"
6. Fill in all required fields
7. Optionally add images
8. Tap "Add Product"
9. Success → Return to home

## Field Validations

### Required Fields (Edit):

- Product name
- Price (must be > 0)
- Stock quantity (must be >= 0)
- Category selection

### Required Fields (Add):

- Barcode
- Barcode type
- SKU
- Product name
- Price (must be > 0)
- Stock quantity (must be >= 0)
- Category selection

### Optional Fields:

- Description
- Sale price (only when sale active)
- Product images (add screen only)
- Exclude from discount toggle

## Error Handling

The app handles various error scenarios:

- **Camera Permission Denied**: Shows permission request screen
- **Product Not Found**: Offers to add new product
- **Network Errors**: Shows offline banner, prevents API calls
- **Validation Errors**: Shows specific field errors
- **Server Errors**: Shows user-friendly error messages

## Offline Support

- **Statistics**: Stored locally in AsyncStorage
- **Product Catalog**: Cached for offline viewing
- **Limitations**: Cannot edit/add products while offline (requires backend)

## Security Considerations

- Authentication required via JWT token
- Token passed in API requests via `Authorization: Bearer <token>`
- Role verified on backend before allowing product modifications
- Images uploaded securely via multipart/form-data

## Testing Checklist

### Scan Functionality

- [ ] Camera permission requested
- [ ] Barcode scanning works for all types
- [ ] Manual entry works
- [ ] Product found → navigates to edit
- [ ] Product not found → shows add option

### Edit Screen

- [ ] Pre-populated with product data
- [ ] Image displays correctly
- [ ] All fields editable except barcode/SKU
- [ ] Category dropdown loads
- [ ] Unit picker works
- [ ] Sale toggle works
- [ ] Update succeeds
- [ ] Validation works

### Add Screen

- [ ] Barcode pre-filled from scan
- [ ] SKU auto-generates
- [ ] Image picker works
- [ ] Multiple images can be added
- [ ] Images can be removed
- [ ] All pickers work
- [ ] Form validation works
- [ ] Product creation succeeds

### Navigation

- [ ] Home → Scan → Edit → Home flow works
- [ ] Home → Scan → Add → Home flow works
- [ ] Back button works on all screens
- [ ] Logout works

### Statistics

- [ ] Stats increment on scan
- [ ] Stats increment on update
- [ ] Stats increment on add
- [ ] Stats persist after app restart

## Troubleshooting

### "Product not found" for existing products

- Verify barcode in database matches scanned value
- Check barcode type matches product's barcodeType field
- Ensure product is not soft-deleted (deletedAt should be null)

### Images not uploading

- Verify Cloudinary credentials in backend `.env`
- Check image file size (may be too large)
- Ensure multipart/form-data is properly handled

### Category dropdown empty

- Verify categories exist in database
- Check network connection
- Verify `/api/v1/category` endpoint is accessible

### Role not working

- Verify user's role in database is exactly "merchandiser"
- Check JWT token contains correct role
- Ensure token is not expired

## Future Enhancements

Potential features to add:

- Bulk product import via CSV
- Product search/browse without scanning
- Low stock alerts
- Price history tracking
- Barcode label printing
- Product analytics dashboard
- Problem reporting system
- Image capture directly from camera
- Offline queue for product changes
- Product duplicate detection
- Inventory adjustment workflows

## Support

For issues or questions:

1. Check error logs in app console
2. Verify backend API is running
3. Check network connectivity
4. Review this documentation
5. Contact development team

## Version History

- **v1.0.0** (2026-03-06): Initial implementation
  - Basic merchandiser role
  - Product scan, edit, and add features
  - Activity tracking
  - Image upload support

---

**Last Updated**: March 6, 2026
**Author**: ConsoliScan Development Team
