# RMA (Return Merchandise Authorization) API Documentation

## Overview
The RMA system allows users to submit device return requests with attachments (invoices, PO, photos, PDFs), and admins can review, approve, or reject these requests.

---

## 🔹 User Workflow

### 1. Submit RMA with Attachments
**Endpoint:** `POST /api/rma/submit`  
**Content-Type:** `multipart/form-data`  
**Description:** User submits RMA request with files

**Form Fields:**
```javascript
{
  serialNumber: "SN12345",          // Required
  rmaType: "repair",                 // Required: "repair", "replacement", "refund"
  issueDescription: "Device not working", // Required
  reportedBy: "John Doe",           // Required
  reportedByEmail: "john@example.com",
  reportedByPhone: "+1234567890",
  priority: "high"                  // Optional: "low", "medium", "high", "critical"
}
```

**File Fields:**
- `invoice` - Single file (Invoice document)
- `purchaseOrder` - Single file (Purchase Order document)
- `photos` - Up to 5 files (Photos of the device/issue)
- `additionalDocs` - Up to 3 files (Any additional documents)

**Allowed File Types:**
- Images: JPEG, JPG, PNG, GIF
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Max file size: 10MB per file

**Example using FormData (Frontend):**
```javascript
const formData = new FormData();
formData.append('serialNumber', 'SN12345');
formData.append('rmaType', 'repair');
formData.append('issueDescription', 'Device not working properly');
formData.append('reportedBy', 'John Doe');
formData.append('reportedByEmail', 'john@example.com');
formData.append('reportedByPhone', '+1234567890');
formData.append('priority', 'high');

// Attach files
formData.append('invoice', invoiceFile);
formData.append('purchaseOrder', poFile);
formData.append('photos', photo1);
formData.append('photos', photo2);

const response = await fetch('http://localhost:4000/api/rma/submit', {
  method: 'POST',
  body: formData
});
```

**Response:**
```json
{
  "success": true,
  "message": "RMA submitted successfully. Admin will review your request.",
  "rma": {
    "_id": "...",
    "rmaNumber": "RMA-202511-0001",
    "serialNumber": "SN12345",
    "status": "pending_review",
    "rmaType": "repair",
    "issueDescription": "Device not working",
    "reportedBy": "John Doe",
    "attachments": {
      "invoice": { "filename": "invoice.pdf", "path": "...", "uploadedAt": "..." },
      "purchaseOrder": { "filename": "po.pdf", "path": "...", "uploadedAt": "..." },
      "photos": [...]
    },
    "createdAt": "2025-11-28T..."
  }
}
```

---

## 🔹 Admin Workflow

### 2. Get Pending RMAs (Admin Dashboard)
**Endpoint:** `GET /api/rma/admin/pending`  
**Description:** Get all RMAs waiting for admin review

**Response:**
```json
{
  "count": 5,
  "rmas": [
    {
      "_id": "...",
      "rmaNumber": "RMA-202511-0001",
      "serialNumber": "SN12345",
      "status": "pending_review",
      "reportedBy": "John Doe",
      "reportedByEmail": "john@example.com",
      "priority": "high",
      "attachments": {...},
      "createdAt": "2025-11-28T..."
    }
  ]
}
```

### 3. Approve RMA (Admin Action)
**Endpoint:** `PUT /api/rma/:id/approve`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "approvedBy": "Admin Name",
  "notes": "Approved for repair",
  "vendorId": "vendor_object_id",  // Optional
  "estimatedReturnDate": "2025-12-15"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "RMA approved successfully",
  "rma": {
    "_id": "...",
    "rmaNumber": "RMA-202511-0001",
    "status": "approved",
    "approvedBy": "Admin Name",
    "approvedDate": "2025-11-28T..."
  }
}
```

### 4. Reject RMA (Admin Action)
**Endpoint:** `PUT /api/rma/:id/reject`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "rejectedBy": "Admin Name",
  "rejectionReason": "Serial number not found in system"
}
```

**Response:**
```json
{
  "success": true,
  "message": "RMA rejected",
  "rma": {
    "_id": "...",
    "rmaNumber": "RMA-202511-0001",
    "status": "rejected",
    "rejectionReason": "Serial number not found in system"
  }
}
```

---

## 🔹 Common Operations

### 5. Get All RMAs (with filters)
**Endpoint:** `GET /api/rma`  
**Query Parameters:**
- `status` - Filter by status
- `priority` - Filter by priority
- `rmaType` - Filter by type
- `deviceId` - Filter by device ID

**Examples:**
```
GET /api/rma
GET /api/rma?status=pending_review
GET /api/rma?priority=high
GET /api/rma?status=approved&priority=critical
```

### 6. Get RMA by ID
**Endpoint:** `GET /api/rma/:id`

### 7. Update RMA Status
**Endpoint:** `PUT /api/rma/:id/status`  
**Request Body:**
```json
{
  "status": "in_transit_to_vendor",
  "updatedBy": "Admin Name",
  "notes": "Shipped to vendor via FedEx"
}
```

### 8. Update RMA Details
**Endpoint:** `PUT /api/rma/:id`  
**Request Body:** (Any RMA fields except status)
```json
{
  "vendorRmaNumber": "VND-12345",
  "shippingTrackingNumber": "TRACK123456",
  "repairCost": 150.00,
  "resolutionNotes": "Screen replaced"
}
```

### 9. Download RMA Attachment
**Endpoint:** `GET /api/rma/:id/download/:fileType/:index?`

**Examples:**
```
GET /api/rma/673d1a2b3c4d5e6f7a8b9c0d/download/invoice
GET /api/rma/673d1a2b3c4d5e6f7a8b9c0d/download/purchaseOrder
GET /api/rma/673d1a2b3c4d5e6f7a8b9c0d/download/photo/0
GET /api/rma/673d1a2b3c4d5e6f7a8b9c0d/download/photo/1
GET /api/rma/673d1a2b3c4d5e6f7a8b9c0d/download/additional/0
```

### 10. Get RMA Statistics
**Endpoint:** `GET /api/rma/stats/overview`

**Response:**
```json
{
  "totalRMAs": 50,
  "pendingRMAs": 5,
  "newSubmissions": 3,
  "inProgressRMAs": 15,
  "completedRMAs": 25,
  "rejectedRMAs": 5,
  "rmasByType": [
    { "_id": "repair", "count": 30 },
    { "_id": "replacement", "count": 15 },
    { "_id": "refund", "count": 5 }
  ],
  "rmasByPriority": [
    { "_id": "high", "count": 10 },
    { "_id": "medium", "count": 25 },
    { "_id": "low", "count": 15 }
  ],
  "avgRepairCost": 125.50
}
```

### 11. Delete RMA
**Endpoint:** `DELETE /api/rma/:id`

---

## 🔹 RMA Status Flow

```
pending_review → approved → in_transit_to_vendor → received_by_vendor 
→ under_repair → repaired → in_transit_to_client → completed

OR

pending_review → rejected
pending_review → cancelled
```

---

## 🔹 Real-time Notifications (Socket.IO)

### Events Emitted:

1. **When user submits RMA:**
```javascript
// General notification
socket.on('notification', (data) => {
  // { title: "New RMA Submission", message: "...", type: "rma_created", ... }
});

// Admin-specific notification
socket.on('admin:newRMA', (data) => {
  // { rmaNumber: "...", serialNumber: "...", reportedBy: "...", ... }
});
```

2. **When admin approves RMA:**
```javascript
socket.on('notification', (data) => {
  // { title: "RMA Approved", message: "...", type: "rma_approved", ... }
});
```

3. **When admin rejects RMA:**
```javascript
socket.on('notification', (data) => {
  // { title: "RMA Rejected", message: "...", type: "rma_rejected", ... }
});
```

4. **When RMA status is updated:**
```javascript
socket.on('notification', (data) => {
  // { title: "RMA Status Updated", message: "...", type: "rma_status_updated", ... }
});
```

---

## 🔹 Testing with Postman/Thunder Client

### Test User Submission:
1. Create new POST request to `http://localhost:4000/api/rma/submit`
2. Set Body type to `form-data`
3. Add text fields: serialNumber, rmaType, issueDescription, reportedBy, etc.
4. Add file fields: invoice, purchaseOrder, photos, additionalDocs
5. Send request

### Test Admin Approval:
1. Get RMA ID from pending list
2. Create PUT request to `http://localhost:4000/api/rma/{id}/approve`
3. Set Body to JSON:
```json
{
  "approvedBy": "Admin Name",
  "notes": "Approved for processing"
}
```
4. Send request

---

## 📁 File Storage

Uploaded files are stored in: `uploads/rma/`

Each file is renamed with a unique identifier to prevent conflicts.

---

## 🔒 Security Notes

- Add authentication middleware to protect admin routes
- Validate file types and sizes
- Scan uploaded files for malware
- Implement rate limiting for file uploads
- Add authorization checks (only admins can approve/reject)

---

## 📊 Database Schema

### RMA Model Fields:
- `rmaNumber` - Auto-generated (e.g., RMA-202511-0001)
- `serialNumber` - Device serial number (user input)
- `deviceId` - Reference to Device (auto-linked if found)
- `status` - Current status
- `rmaType` - repair/replacement/refund
- `issueDescription` - Problem description
- `reportedBy` - User name
- `reportedByEmail` - User email
- `reportedByPhone` - User phone
- `attachments` - Object containing all file references
- `priority` - low/medium/high/critical
- `vendorId` - Reference to Vendor
- `approvedBy`, `approvedDate` - Admin approval info
- `rejectionReason` - If rejected
- `statusHistory` - Array of status changes with timestamps
- `isNewSubmission` - Flag for new RMAs
- `timestamps` - createdAt, updatedAt

---

## 🎯 Implementation Checklist

✅ User can submit RMA with serial number and attachments
✅ Files uploaded: invoice, PO, photos, PDFs
✅ Admin sees pending RMAs in dashboard
✅ Admin can approve/reject RMAs
✅ Status tracking throughout RMA lifecycle
✅ Real-time notifications via Socket.IO
✅ File download endpoints
✅ Statistics and reporting
✅ Auto-generated RMA numbers with date prefix
✅ Status history tracking

---

## 🚀 Next Steps

1. Add email notifications for RMA status changes
2. Add SMS notifications for critical updates
3. Implement user authentication
4. Add admin role-based access control
5. Create frontend forms for RMA submission
6. Build admin dashboard for RMA management
7. Add barcode/QR code generation for RMA tracking
8. Implement bulk RMA operations for admins
