# ConsoliScan - System Documentation

> **Philippine Retail POS System with BNPC Government Subsidy Integration**

---

## 📋 Table of Contents

1. [System Context](#system-context)
2. [Use Cases](#use-cases)
3. [Entity Relationship Diagram (ERD)](#entity-relationship-diagram)
4. [Data Flow Diagram (DFD)](#data-flow-diagram)
5. [System Sequential Diagrams](#system-sequential-diagrams)
6. [System Flowchart](#system-flowchart)

---

## System Context

### 📌 Brief Overview

**ConsoliScan** is a comprehensive retail point-of-sale (POS) system designed for Philippine retailers, integrating government subsidy verification through BNPC (Bangko Ng Pilipinas Cooperative). The system manages inventory, transactions, employee workflows, and eligibility verification for subsidized products.

### Core Components

| Component                     | Purpose                                     | Technology                |
| ----------------------------- | ------------------------------------------- | ------------------------- |
| **Backend API**               | Business logic, database, authentication    | Node.js, Express, MongoDB |
| **Web Admin Panel**           | Admin dashboard, reporting, user management | React, Vite, Material-UI  |
| **Mobile App (Customer)**     | Customer checkout, product scanning         | React Native, Expo        |
| **Mobile App (Merchandiser)** | Inventory management, product scanning      | React Native, Expo        |
| **ML Service**                | Product detection via barcode scanning      | FastAPI, YOLOv8, PyTorch  |

### Key Features

- ✅ Multi-role access (User, Admin, Super Admin, Checker, Merchandiser)
- ✅ Real-time inventory tracking
- ✅ Government subsidy eligibility verification
- ✅ Offline-first transaction capability
- ✅ Barcode scanning with AI detection
- ✅ Checkout queue management
- ✅ Loyalty rewards system
- ✅ Blockchain audit trails (BigchainDB)
- ✅ Sales analytics & reporting

---

## Use Cases

### 🧑‍💼 Use Case 1: Customer Shopping & Checkout

**Actor**: Customer (User Role)

**Main Flow**:

1. Customer enters store
2. System verifies BNPC eligibility status
3. Customer scans products or enters manually
4. System shows product details and availability
5. Customer adds items to cart
6. Customer proceeds to checkout
7. System calculates total (applies subsidies if eligible)
8. Payment is processed
9. Receipt is generated
10. Loyalty points are awarded

**Alternative**: Offline mode - transactions sync when online

---

### 🏪 Use Case 2: Merchandiser Product Management

**Actor**: Merchandiser (New Role)

**Main Flow**:

1. Merchandiser scans barcode of product
2. System searches local catalog first, then API
3. **If Product Exists**:
   - Shows product details (name, price, stock, category)
   - Merchandiser can edit (price, stock, images, category)
   - System updates product in database
   - Stats updated (productsUpdated++)

4. **If Product Not Found**:
   - System offers to create new product
   - Merchandiser fills product form (name, barcode, price, category, images)
   - System validates and creates product
   - Stats updated (productsAdded++)

**Offline Support**: Scans cached in buffer, API calls when online

---

### 👨‍💼 Use Case 3: Admin User Management

**Actor**: Admin

**Main Flow**:

1. Admin accesses RolesPermissions page
2. Views all users with roles (User, Admin, Super Admin, Checker, Merchandiser)
3. Can assign roles to users
4. Can filter by role
5. Can view activity logs per role
6. System displays statistics (total users per role)

---

### 🔐 Use Case 4: BNPC Subsidy Verification

**Actor**: System + Checker Role

**Main Flow**:

1. Customer initiates checkout
2. System queries eligibility status from BNPC integration
3. Checker reviews eligibility details
4. If eligible: subsidy is applied automatically
5. Total price is recalculated
6. Receipt shows subsidy amount
7. Transaction is logged with subsidy details

---

### 📊 Use Case 5: Admin Dashboard Analytics

**Actor**: Super Admin / Admin

**Main Flow**:

1. Admin views dashboard
2. System displays:
   - Total daily/weekly/monthly sales
   - Revenue breakdown by category
   - Inventory status
   - User activity logs
   - Subsidy statistics
   - Checkout queue metrics
3. Admin can generate reports
4. Reports can be exported as PDF/CSV

---

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ ACTIVITY_LOG : generates
    USER ||--o{ CART : has
    USER ||--o{ SAVED_ITEMS : saves
    USER ||--o{ LOYALTY_CONFIG : "earns points from"

    PRODUCT ||--o{ ORDER : "included in"
    PRODUCT ||--o{ CART_ITEM : "added to"
    PRODUCT ||--o{ STOCK_MOVEMENT : "tracked in"
    PRODUCT ||--o{ SAVED_ITEMS : referenced
    PRODUCT }o--|| CATEGORY : "belongs to"

    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ ACTIVITY_LOG : generates
    ORDER ||--o{ BLOCKCHAIN_AUDIT : "recorded in"

    CATEGORY ||--o{ PRODUCT : contains
    CATEGORY ||--o{ PROMO : targets

    PROMO ||--o{ ORDER : "applied to"
    PROMO ||--o{ DISCOUNT_VALIDATOR : validates

    PURCHASE_ORDER ||--o{ STOCK_MOVEMENT : generates
    PURCHASE_ORDER ||--o{ SUPPLIER : "from"

    SUPPLIER ||--o{ PURCHASE_ORDER : supplies

    CHECKOUT_QUEUE ||--o{ ORDER : "processes"

    ELIGIBLE ||--o{ USER : "verifies eligibility for"
    ELIGIBLE ||--o{ PROMO : determines

    LOYALTY_CONFIG ||--o{ ORDER : "applied toorder"

    STORE_SETTINGS ||--o{ USER : "configures"

    EXPENSE ||--o{ ACTIVITY_LOG : tracks

    RETURN ||--o{ ORDER : "reverses"
    RETURN ||--o{ STOCK_MOVEMENT : generates

    STOCK_MOVEMENT {
        string id PK
        string productId FK
        string type "IN, OUT, ADJUSTMENT"
        int quantity
        string reason
        string movementDate
    }

    USER {
        string userId PK
        string email UK
        string password
        string name
        string role "user, admin, super_admin, checker, merchandiser"
        string status "active, inactive"
        datetime createdAt
    }

    PRODUCT {
        string productId PK
        string barcode UK
        string name
        string description
        decimal price
        decimal salePrice
        boolean saleActive
        int stockQuantity
        string categoryId FK
        array images
        string unit
        datetime createdAt
        datetime deletedAt
    }

    CATEGORY {
        string categoryId PK
        string name
        string icon
        datetime createdAt
    }

    ORDER {
        string orderId PK
        string userId FK
        array items
        decimal totalAmount
        decimal discountAmount
        decimal subsidyAmount
        string paymentMethod
        string status "pending, completed, cancelled"
        datetime createdAt
    }

    CART {
        string cartId PK
        string userId FK
        array items
        decimal subtotal
        datetime createdAt
    }

    ELIGIBLE {
        string eligibleId PK
        string userId FK
        boolean isEligible
        string reason
        datetime verifiedAt
    }

    PROMO {
        string promoId PK
        string name
        string description
        decimal discountAmount
        string discountType "percentage, fixed"
        datetime validFrom
        datetime validUntil
    }

    ACTIVITY_LOG {
        string logId PK
        string userId FK
        string action
        string status
        string details
        datetime timestamp
    }
```

---

## Data Flow Diagram

### Level 0: System Context

```mermaid
graph TB
    Customer["👤 Customer"]
    Admin["👨‍💼 Admin"]
    Merchandiser["🛍️ Merchandiser"]
    BNPC["🏛️ BNPC System"]

    ConsoliScan["🛒 ConsoliScan System"]

    Customer -->|"Scan products, checkout"| ConsoliScan
    Admin -->|"Manage users, view reports"| ConsoliScan
    Merchandiser -->|"Add/Edit products"| ConsoliScan
    ConsoliScan -->|"Verify eligibility"| BNPC
    BNPC -->|"Eligibility status"| ConsoliScan
    ConsoliScan -->|"Transaction receipt"| Customer
```

### Level 1: Main Data Flows

```mermaid
graph LR
    subgraph "Input"
        Scanner["📱 Barcode Scanner"]
        KeyInput["⌨️ Manual Input"]
        Payment["💳 Payment Method"]
    end

    subgraph "Processing"
        API["REST API"]
        DB["MongoDB<br/>Database"]
        Cache["📦 Cache<br/>AsyncStorage"]
        Auth["🔐 JWT Auth"]
    end

    subgraph "Output"
        Receipt["🧾 Receipt"]
        Dashboard["📊 Dashboard"]
        Report["📋 Report"]
        Queue["🚶 Queue Status"]
    end

    subgraph "External"
        BNPC["BNPC API"]
        Cloudinary["☁️ Cloudinary<br/>Images"]
        BigchainDB["⛓️ BigchainDB<br/>Audit Trail"]
    end

    Scanner --> API
    KeyInput --> API
    Payment --> API

    API --> Auth
    Auth --> DB
    DB --> API

    API --> Cache
    Cache --> API

    API --> Receipt
    API --> Dashboard
    API --> Report
    API --> Queue

    API --> BNPC
    BNPC --> API

    API --> Cloudinary
    Cloudinary --> API

    API --> BigchainDB
    BigchainDB --> API
```

### Level 2: Customer Checkout Flow

```mermaid
graph TD
    A["Customer Starts<br/>Shopping"] --> B["Scan/Enter<br/>Barcode"]
    B --> C{Product<br/>Found?}
    C -->|Yes| D["Show Product<br/>Details"]
    C -->|No| E["Show Error<br/>Suggestion"]
    D --> F["Add to Cart"]
    E --> B

    F --> G{Continue<br/>Shopping?}
    G -->|Yes| B
    G -->|No| H["Proceed to<br/>Checkout"]

    H --> I["Verify Eligibility<br/>via BNPC"]
    I --> J{Eligible?}
    J -->|Yes| K["Apply Subsidy"]
    J -->|No| L["Regular Price"]

    K --> M["Calculate Total"]
    L --> M

    M --> N["Process<br/>Payment"]
    N --> O{Payment<br/>Approved?}

    O -->|Yes| P["Generate Receipt"]
    O -->|No| Q["Show Error<br/>Retry"]

    P --> R["Award Loyalty<br/>Points"]
    Q --> N

    R --> S["End Transaction"]
```

---

## System Sequential Diagrams

### Sequence 1: Merchandiser Scan & Update Product

```mermaid
sequenceDiagram
    participant Merchandiser as 🛍️ Merchandiser
    participant Mobile as 📱 Mobile App
    participant API as 🔗 Backend API
    participant DB as 💾 MongoDB
    participant BNPC as 🏛️ BNPC

    Merchandiser->>Mobile: Scan barcode
    Mobile->>Mobile: Verify 8x consistency
    Mobile->>Mobile: Show 100% progress

    Mobile->>API: GET /scan/merchandiser?barcode=1234
    API->>DB: Find product by barcode

    alt Product Found
        DB-->>API: Product data
        API-->>Mobile: {found: true, product: {...}}
        Mobile->>Mobile: Navigate to EditScreen
        Merchandiser->>Mobile: Edit price/stock
        Mobile->>API: PUT /product/123 (multipart)
        API->>DB: Update product
        DB-->>API: Updated product
        API-->>Mobile: Success
        Mobile->>Mobile: Store stats locally
    else Product Not Found
        DB-->>API: null
        API-->>Mobile: {found: false, barcode: "1234"}
        Mobile->>Mobile: Show "Add Product?" dialog
        Merchandiser->>Mobile: Click "Add Product"
        Mobile->>Mobile: Navigate to AddScreen
        Merchandiser->>Mobile: Fill form + upload images
        Mobile->>API: POST /product (multipart/form-data)
        API->>DB: Create new product
        DB-->>API: New product
        API-->>Mobile: Success
        Mobile->>Mobile: Store stats: productsAdded++
    end

    Mobile->>Mobile: Increment stats
    Mobile->>Mobile: Sync to AsyncStorage
```

### Sequence 2: Customer Checkout with Subsidy

```mermaid
sequenceDiagram
    participant Customer as 👤 Customer
    participant Mobile as 📱 Mobile App
    participant API as 🔗 Backend API
    participant DB as 💾 MongoDB
    participant BNPC as 🏛️ BNPC
    participant BlockchainDB as ⛓️ BigchainDB

    Customer->>Mobile: Add items to cart
    Customer->>Mobile: Click "Checkout"

    Mobile->>API: POST /checkout (cart items)
    API->>DB: Retrieve products
    DB-->>API: Product details

    API->>BNPC: Verify eligibility (userId)
    BNPC-->>API: {eligible: true, amount: 500}

    alt Eligible
        API->>API: Calculate subsidy
        API->>API: Reduce total price
    else Not Eligible
        API->>API: Regular price
    end

    API->>DB: Create order record
    DB-->>API: Order created

    API->>BlockchainDB: Log transaction (audit trail)
    BlockchainDB-->>API: Confirmed

    API-->>Mobile: {orderId, total, subsidy, receipt}
    Mobile->>Mobile: Show receipt
    Customer->>Mobile: View receipt
    Mobile->>Mobile: Award loyalty points
```

### Sequence 3: Admin Assign Merchandiser Role

```mermaid
sequenceDiagram
    participant Admin as 👨‍💼 Admin
    participant Web as 🌐 Web Dashboard
    participant API as 🔗 Backend API
    participant DB as 💾 MongoDB

    Admin->>Web: Open RolesPermissions page
    Web->>API: GET /users (all users)
    API->>DB: Find all users
    DB-->>API: Users list
    API-->>Web: Users with roles
    Web->>Web: Render users table

    Admin->>Web: Find user "John"
    Web->>Web: Filter/search users
    Admin->>Web: Click "Edit" on John
    Web->>Web: Show role dropdown
    Admin->>Web: Select "Merchandiser"
    Web->>Web: Show merchandiser badge
    Admin->>Web: Click "Save"

    Web->>API: PUT /user/{userId} {role: "merchandiser"}
    API->>API: Verify admin authorization
    API->>DB: Update user role
    DB-->>API: Updated user
    API-->>Web: Success
    Web->>Web: Show success toast
    Web->>Web: Update stats (merchandisers++)
```

---

## System Flowchart

### Main System Flow

```mermaid
flowchart TD
    Start([🚀 System Start]) --> AuthCheck{User<br/>Authenticated?}

    AuthCheck -->|No| LoginFlow["📝 Login/Register Flow"]
    AuthCheck -->|Yes| RoleCheck{User<br/>Role?}

    LoginFlow --> AuthCheck

    RoleCheck -->|Customer| CustomerHome["🛒 Customer Home"]
    RoleCheck -->|Checker| CheckerQueue["🚶 Checkout Queue"]
    RoleCheck -->|Merchandiser| MerchHome["📦 Merchandiser Home"]
    RoleCheck -->|Admin| AdminDash["📊 Admin Dashboard"]
    RoleCheck -->|Super Admin| SuperAdminDash["🔑 Super Admin Panel"]

    CustomerHome --> ScanOrBrowse{Action?}
    ScanOrBrowse -->|Scan| ScanFlow["📱 Barcode Scan"]
    ScanOrBrowse -->|Browse| BrowseFlow["📋 Browse Catalog"]
    ScanOrBrowse -->|View Cart| CartFlow["🛒 Shopping Cart"]

    ScanFlow --> AddCart["➕ Add to Cart?"]
    BrowseFlow --> AddCart
    AddCart -->|Yes| CartFlow
    AddCart -->|No| ScanOrBrowse

    CartFlow --> CheckoutDecision{Checkout?}
    CheckoutDecision -->|No| ScanOrBrowse
    CheckoutDecision -->|Yes| VerifyEligibility["🏛️ Verify BNPC<br/>Eligibility"]

    VerifyEligibility --> EligibilityCheck{Eligible?}
    EligibilityCheck -->|Yes| ApplySubsidy["💰 Apply Subsidy"]
    EligibilityCheck -->|No| RegularPrice["💵 Regular Price"]

    ApplySubsidy --> PaymentFlow["💳 Payment Process"]
    RegularPrice --> PaymentFlow

    PaymentFlow --> PaymentCheck{Payment<br/>Approved?}
    PaymentCheck -->|No| PaymentRetry["🔄 Retry/Cancel"]
    PaymentCheck -->|Yes| GenerateReceipt["🧾 Generate Receipt"]

    PaymentRetry -->|Retry| PaymentFlow
    PaymentRetry -->|Cancel| ScanOrBrowse

    GenerateReceipt --> LogAudit["⛓️ Log to Blockchain<br/>Audit Trail"]
    LogAudit --> AwardLoyalty["🎁 Award Loyalty Points"]
    AwardLoyalty --> EndTransaction["✅ End Transaction"]
    EndTransaction --> ScanOrBrowse

    MerchHome --> MerchAction{Action?}
    MerchAction -->|Scan Barcode| MerchScan["🔍 Scan Product"]
    MerchAction -->|View Home| MerchHome

    MerchScan --> ProductFound{Found<br/>in DB?}
    ProductFound -->|Yes| EditScreen["✏️ Edit Product<br/>Details"]
    ProductFound -->|No| AddScreen["➕ Add New<br/>Product"]

    EditScreen --> UpdateDB["🔄 Update to Database"]
    AddScreen --> UploadImages["📸 Upload Images<br/>to Cloudinary"]
    UploadImages --> CreateDB["🆕 Create in Database"]

    UpdateDB --> UpdateStats["📊 Update Stats"]
    CreateDB --> UpdateStats
    UpdateStats --> MerchHome

    AdminDash --> AdminAction{Action?}
    AdminAction -->|Manage Users| UsersFlow["👥 RolesPermissions"]
    AdminAction -->|View Reports| ReportFlow["📈 Analytics Reports"]
    AdminAction -->|View Logs| LogsFlow["📝 Activity Logs"]

    UsersFlow --> EditRole["🔧 Assign/Edit Roles"]
    EditRole --> AdminDash

    ReportFlow --> GenerateReport["📄 Generate Report"]
    GenerateReport --> AdminDash

    LogsFlow --> FilterLogs["🔍 Filter Logs"]
    FilterLogs --> AdminDash

    style Start fill:#22c55e
    style EndTransaction fill:#22c55e
    style AuthCheck fill:#3b82f6
    style RoleCheck fill:#3b82f6
    style PaymentCheck fill:#ef4444
    style ProductFound fill:#ef4444
    style EligibilityCheck fill:#ef4444
```

### Offline-First Transaction Flow

```mermaid
flowchart LR
    OnlineCheck{Device<br/>Online?}

    OnlineCheck -->|Yes| OnlineMode["🟢 Online Mode"]
    OnlineCheck -->|No| OfflineMode["🔴 Offline Mode"]

    OnlineMode --> RealTimeAPI["⚡ Real-time API Calls"]
    RealTimeAPI --> ImmediateSync["📡 Immediate Sync"]
    ImmediateSync --> UpdateDB["💾 Update Server DB"]

    OfflineMode --> LocalStorage["💿 Store in AsyncStorage"]
    LocalStorage --> QueueTrans["📋 Queue Transactions"]
    QueueTrans --> CacheData["📦 Cache Catalog"]

    CacheData --> OfflineOps["✅ Perform Operations<br/>Offline"]
    OfflineOps --> WaitOnline["⏳ Waiting for<br/>Connection..."]

    WaitOnline --> OnlineNotif["🔗 Connection Restored"]
    OnlineNotif --> SyncPending["🔄 Sync Pending<br/>Transactions"]
    SyncPending --> RepreyFailed["🔁 Retry Failed<br/>Operations"]
    RepreyFailed --> UpdateDB

    UpdateDB --> SyncComplete["✅ Sync Complete"]
    SyncComplete --> ClearQueue["🗑️ Clear Queue"]

    style OnlineMode fill:#22c55e
    style OfflineMode fill:#f97316
    style SyncComplete fill:#22c55e
```

---

## Key Data Models

### User Model

```json
{
  "userId": "unique_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "merchandiser|user|checker|admin|super_admin",
  "status": "active|inactive",
  "createdAt": "2024-01-01",
  "lastLogin": "2024-03-07"
}
```

### Product Model

```json
{
  "productId": "unique_id",
  "barcode": "1234567890",
  "name": "Product Name",
  "price": 99.99,
  "salePrice": 79.99,
  "saleActive": true,
  "stockQuantity": 150,
  "categoryId": "cat_001",
  "images": [{ "url": "...", "public_id": "..." }],
  "description": "Product description",
  "unit": "pc|kg|box",
  "createdAt": "2024-01-01",
  "deletedAt": null
}
```

### Order Model

```json
{
  "orderId": "unique_id",
  "userId": "user_001",
  "items": [
    {
      "productId": "prod_001",
      "quantity": 2,
      "unitPrice": 99.99,
      "subtotal": 199.98
    }
  ],
  "totalAmount": 299.98,
  "discountAmount": 20.0,
  "subsidyAmount": 50.0,
  "finalAmount": 229.98,
  "paymentMethod": "cash|card|gcash",
  "status": "completed",
  "createdAt": "2024-03-07"
}
```

---

## Technology Stack

| Layer              | Technology                | Purpose                      |
| ------------------ | ------------------------- | ---------------------------- |
| **Frontend**       | React, Vite, Material-UI  | Admin dashboard              |
| **Mobile**         | React Native, Expo        | Customer & Merchandiser apps |
| **Backend**        | Node.js, Express          | REST API                     |
| **Database**       | MongoDB, Mongoose         | Data persistence             |
| **Authentication** | JWT, Firebase             | Secure access                |
| **Real-time**      | Socket.io                 | Live notifications           |
| **File Storage**   | Cloudinary                | Image management             |
| **Audit Trail**    | BigchainDB                | Blockchain records           |
| **Payment**        | Integration ready         | Payment processing           |
| **ML/AI**          | FastAPI, YOLOv8           | Product detection            |
| **Cache**          | AsyncStorage, Redis ready | Client-side & server caching |

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    ConsoliScan System                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  REST API    │◄───────►│  MongoDB     │                 │
│  │  (Node.js)   │         │  Database    │                 │
│  └──────────────┘         └──────────────┘                 │
│         ▲                                                   │
│    ┌────┼────┬────────┬──────────┬──────────┐               │
│    │    │    │        │          │          │               │
│    ▼    ▼    ▼        ▼          ▼          ▼               │
│  ┌───┐ ┌───┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │Web│ │App│ │BNPC  │ │Firebase│ │Cloudry│ │Bigchain│   │
│  │UI │ │CLI│ │API   │ │Auth    │ │Images │ │DB      │   │
│  └───┘ └───┘ └──────┘ └────────┘ └────────┘ └────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## System Constraints & Considerations

### Performance

- Offline-first architecture reduces latency
- AsyncStorage caching for frequent data
- Redis integration ready for scaling
- Database indexing on barcode, email, userId

### Security

- JWT token-based authentication
- Role-based access control (RBAC)
- Encrypted password storage
- Audit logging on all transactions
- Blockchain verification for high-value transactions

### Scalability

- Microservices-ready architecture
- API gateway pattern implemented
- Database replication ready
- Load balancing compatible

### Reliability

- Transaction rollback on failure
- Duplicate detection on scans
- Error recovery mechanisms
- Comprehensive logging

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Internet                              │
└────────┬──────────────────────────────────────────────┬─┘
         │                                              │
    ┌────▼────┐                                   ┌────▼────┐
    │ Web UI  │◄──────────────────────►           │  Mobile │
    │ React   │     HTTPS/WebSocket              │ Apps    │
    │ (Custom │                                   │ (Expo)  │
    │ Domain) │                                   │         │
    └─────────┘                                   └────┬────┘
              │                                       │
              └───────────────┬──────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   API Gateway      │
                    │   (Load Balancer)  │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         ┌────▼──────┐   ┌────▼──────┐  ┌────▼──────┐
         │ Backend 1  │   │ Backend 2  │  │ Backend N │
         │(Node.js)   │   │(Node.js)   │  │(Node.js)  │
         └────┬───────┘   └────┬───────┘  └────┬──────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  MongoDB Cluster   │
                    │  (Replication Set) │
                    └────────────────────┘
```

---

## Future Enhancements

- [ ] Multi-currency support
- [ ] Advanced analytics with ML predictions
- [ ] Real-time inventory sync across branches
- [ ] Mobile payment integration (GCash, PayMaya)
- [ ] Facial recognition for loyalty rewards
- [ ] IoT-based vending machine support
- [ ] Sustainability tracking (carbon footprint)
- [ ] Supply chain transparency (from farm to store)

---

**Document Version**: 1.0  
**Last Updated**: March 7, 2026  
**System Status**: ✅ Production Ready
