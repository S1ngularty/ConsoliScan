# Admin Dashboard API Documentation

## Base URL

```
http://localhost:5000/api/v1/admin
```

All endpoints require authentication and admin role.

---

## Authentication

All requests must include:

- **Authorization Header**: `Bearer {jwt_token}`
- **Role**: User must have `admin` role

---

## Endpoints

### 1. Dashboard Summary

Get a quick overview of all important metrics.

**Endpoint**: `GET /dashboard/summary`

**Response**:

```json
{
  "totalUsers": 150,
  "totalProducts": 500,
  "totalOrders": 1200,
  "totalCategories": 20,
  "totalRevenue": 50000,
  "averageOrderValue": 41.67,
  "recentActivity": [
    {
      "_id": "...",
      "userId": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action": "CREATE_PRODUCT",
      "status": "SUCCESS",
      "description": "create a new product named 'Product Name'"
    }
  ]
}
```

---

### 2. Sales Analytics

Get detailed sales data with multiple grouping options.

**Endpoint**: `GET /analytics/sales`

**Query Parameters**:

- `startDate` (optional): ISO date string (e.g., `2024-01-01`)
- `endDate` (optional): ISO date string (e.g., `2024-12-31`)
- `groupBy` (optional): `day`, `week`, or `month` (default: `day`)

**Example**:

```
GET /analytics/sales?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
```

**Response**:

```json
{
  "groupBy": "month",
  "data": [
    {
      "_id": {
        "year": 2024,
        "month": 1
      },
      "totalSales": 15000,
      "orderCount": 120,
      "averageOrderValue": 125,
      "totalQuantity": 450
    }
  ],
  "summary": {
    "totalSales": 50000,
    "totalOrders": 1000,
    "averageOrderValue": 50
  }
}
```

---

### 3. Product Analytics

Get top performing products with customizable sorting.

**Endpoint**: `GET /analytics/products`

**Query Parameters**:

- `limit` (optional): Number of products to return (default: 10)
- `sortBy` (optional): `sales`, `revenue`, or `rating` (default: `sales`)

**Example**:

```
GET /analytics/products?limit=20&sortBy=revenue
```

**Response**:

```json
{
  "limit": 20,
  "sortBy": "revenue",
  "data": [
    {
      "_id": "...",
      "productName": "Premium Coffee",
      "sku": "PROD-001",
      "totalSold": 500,
      "totalRevenue": 10000,
      "orderCount": 250,
      "averageUnitPrice": 20,
      "currentStock": 150,
      "category": "..."
    }
  ]
}
```

---

### 4. Category Analytics

Get sales breakdown by category.

**Endpoint**: `GET /analytics/categories`

**Response**:

```json
[
  {
    "_id": "...",
    "categoryName": "Electronics",
    "totalSales": 25000,
    "orderCount": 500,
    "totalQuantity": 750,
    "averageOrderValue": 50
  },
  {
    "_id": "...",
    "categoryName": "Groceries",
    "totalSales": 15000,
    "orderCount": 300,
    "totalQuantity": 1000,
    "averageOrderValue": 50
  }
]
```

---

### 5. User Analytics

Get insights about user behavior and spending.

**Endpoint**: `GET /analytics/users`

**Query Parameters**:

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response**:

```json
{
  "totalUsers": 150,
  "newUsers": 25,
  "activeUsersCount": 85,
  "usersByRole": [
    {
      "_id": "customer",
      "count": 140
    },
    {
      "_id": "admin",
      "count": 2
    },
    {
      "_id": "cashier",
      "count": 8
    }
  ],
  "topSpenders": [
    {
      "_id": "...",
      "userName": "Jane Doe",
      "userEmail": "jane@example.com",
      "totalSpent": 5000,
      "orderCount": 50
    }
  ]
}
```

---

### 6. Order Analytics

Get detailed order status and payment method breakdown.

**Endpoint**: `GET /analytics/orders`

**Query Parameters**:

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response**:

```json
{
  "statusBreakdown": [
    {
      "_id": "completed",
      "count": 900,
      "totalRevenue": 45000,
      "averageValue": 50
    },
    {
      "_id": "pending",
      "count": 50,
      "totalRevenue": 2500,
      "averageValue": 50
    },
    {
      "_id": "cancelled",
      "count": 50,
      "totalRevenue": 0,
      "averageValue": 0
    }
  ],
  "paymentMethods": [
    {
      "_id": "card",
      "count": 600,
      "totalAmount": 30000
    },
    {
      "_id": "cash",
      "count": 300,
      "totalAmount": 15000
    }
  ],
  "timingAnalysis": [
    {
      "_id": {
        "hour": 9
      },
      "orderCount": 45,
      "totalRevenue": 2250
    }
  ]
}
```

---

### 7. Inventory Analytics

Get stock levels and inventory value analysis.

**Endpoint**: `GET /analytics/inventory`

**Response**:

```json
{
  "summary": {
    "totalUnits": 10000,
    "totalValue": 500000
  },
  "lowStockProducts": [
    {
      "_id": "...",
      "name": "Premium Coffee",
      "sku": "PROD-001",
      "stock": 5,
      "price": 20
    }
  ],
  "outOfStockProducts": [
    {
      "_id": "...",
      "name": "Organic Tea",
      "sku": "PROD-020",
      "price": 15
    }
  ],
  "stockByCategory": [
    {
      "_id": "...",
      "categoryName": "Beverages",
      "totalStock": 4000,
      "totalValue": 200000,
      "productCount": 50
    }
  ]
}
```

---

### 8. Promotion Analytics

Get promotion usage and effectiveness data.

**Endpoint**: `GET /analytics/promotions`

**Response**:

```json
{
  "totalPromos": 15,
  "activePromos": 8,
  "inactivePromos": 7,
  "performanceData": [
    {
      "_id": "...",
      "promoCode": "SUMMER20",
      "promoName": "Summer Sale 20% Off",
      "usageCount": 150,
      "totalDiscountGiven": 3000,
      "totalOrderValue": 15000,
      "averageDiscount": 20
    }
  ]
}
```

---

### 9. Checkout Queue Analytics

Get real-time checkout queue status.

**Endpoint**: `GET /analytics/checkout-queue`

**Response**:

```json
{
  "statistics": [
    {
      "_id": "waiting",
      "count": 5,
      "averageWaitTime": 180,
      "totalWaitTime": 900
    },
    {
      "_id": "processing",
      "count": 2,
      "averageWaitTime": 120,
      "totalWaitTime": 240
    }
  ],
  "activeQueues": [
    {
      "_id": "...",
      "userId": {
        "_id": "...",
        "name": "Customer Name"
      },
      "cashierId": {
        "_id": "...",
        "name": "Cashier Name"
      },
      "status": "waiting",
      "waitTime": 180,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "totalInQueue": 7
}
```

---

### 10. Activity Logs

Get detailed activity logs with pagination.

**Endpoint**: `GET /logs/activity`

**Query Parameters**:

- `limit` (optional): Records per page (default: 50)
- `page` (optional): Page number (default: 1)
- `userId` (optional): Filter by user ID
- `action` (optional): Filter by action (e.g., `CREATE_PRODUCT`)
- `status` (optional): Filter by status (`SUCCESS` or `FAILED`)

**Example**:

```
GET /logs/activity?limit=20&page=2&action=CREATE_PRODUCT&status=SUCCESS
```

**Response**:

```json
{
  "data": [
    {
      "_id": "...",
      "userId": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin"
      },
      "action": "CREATE_PRODUCT",
      "status": "SUCCESS",
      "description": "create a new product named 'Product Name'",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current": 2,
    "total": 5,
    "totalRecords": 100,
    "perPage": 20
  }
}
```

---

### 11. Comprehensive Report

Get a complete dashboard report with all analytics in one request.

**Endpoint**: `GET /reports/comprehensive`

**Query Parameters**:

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response**:

```json
{
  "generatedAt": "2024-01-15T15:30:00Z",
  "summary": {
    /* dashboard summary data */
  },
  "salesAnalytics": {
    /* sales data */
  },
  "productAnalytics": {
    /* top 5 products */
  },
  "categoryAnalytics": {
    /* category data */
  },
  "userAnalytics": {
    /* user data */
  },
  "orderAnalytics": {
    /* order data */
  },
  "inventoryAnalytics": {
    /* inventory data */
  },
  "promotionAnalytics": {
    /* promotion data */
  },
  "checkoutQueueStatus": {
    /* queue data */
  }
}
```

---

## Error Handling

All endpoints return standard error responses:

**401 Unauthorized**:

```json
{
  "message": "Unauthorized. Please provide a valid token."
}
```

**403 Forbidden**:

```json
{
  "message": "Access denied. Admin only."
}
```

**400 Bad Request**:

```json
{
  "message": "Error message describing what went wrong"
}
```

**500 Server Error**:

```json
{
  "message": "Internal server error"
}
```

---

## Example Usage

### Using cURL

```bash
# Get dashboard summary
curl -X GET "http://localhost:5000/api/v1/admin/dashboard/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get sales analytics for a specific period
curl -X GET "http://localhost:5000/api/v1/admin/analytics/sales?startDate=2024-01-01&endDate=2024-12-31&groupBy=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get top 20 products by revenue
curl -X GET "http://localhost:5000/api/v1/admin/analytics/products?limit=20&sortBy=revenue" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get activity logs (page 1)
curl -X GET "http://localhost:5000/api/v1/admin/logs/activity?limit=50&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get comprehensive report
curl -X GET "http://localhost:5000/api/v1/admin/reports/comprehensive?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using JavaScript/Axios

```javascript
import axios from "axios";

const API_BASE = "http://localhost:5000/api/v1/admin";
const token = "YOUR_JWT_TOKEN";

const config = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

// Get dashboard summary
const summary = await axios.get(`${API_BASE}/dashboard/summary`, config);

// Get sales analytics
const sales = await axios.get(
  `${API_BASE}/analytics/sales?startDate=2024-01-01&endDate=2024-12-31&groupBy=month`,
  config,
);

// Get comprehensive report
const report = await axios.get(`${API_BASE}/reports/comprehensive`, config);
```

---

## Notes

- All date parameters should be in ISO 8601 format (YYYY-MM-DD)
- Prices and monetary values are returned as numbers
- Stock quantities are returned as integers
- All timestamps are in ISO 8601 format with timezone
- The comprehensive report combines all analytics - useful for PDF generation
- Use pagination for activity logs to avoid large data transfers
- Cache results appropriately on the frontend to reduce API calls
