# RMA System - Quick Start Guide

## ✅ What's Been Created

### 1. **Backend Files**
- `src/models/rmaModel.js` - RMA database schema
- `src/controllers/rmaController.js` - Main RMA business logic
- `src/controllers/rmaUploadController.js` - File upload handling
- `src/routes/rmaRoutes.js` - API endpoints
- `src/config/multer.js` - File upload configuration

### 2. **Documentation**
- `RMA_API_DOCUMENTATION.md` - Complete API documentation
- `test-rma-form.html` - Working test form

### 3. **Server Updates**
- `server.js` - Updated with RMA routes and static file serving

---

## 🚀 How to Start

1. **Ensure MongoDB is running**

2. **Install dependencies** (already done):
   ```bash
   npm install multer
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

4. **Test the RMA form**:
   - Open `test-rma-form.html` in your browser
   - Fill out the form with serial number, issue description, etc.
   - Upload files (invoice, PO, photos)
   - Click "Submit RMA Request"

---

## 📋 User Flow

### **STEP 1: User Submits RMA**
- User opens the form
- Enters serial number (e.g., SN12345)
- Selects RMA type (repair/replacement/refund)
- Describes the issue
- Uploads:
  - Invoice (PDF/Image)
  - Purchase Order (PDF/Image)
  - Photos (up to 5)
  - Additional documents (up to 3)
- Clicks Submit
- Receives RMA number (e.g., RMA-202511-0001)
- Status: **pending_review**

### **STEP 2: Admin Sees New RMA**
- Admin receives real-time notification
- Admin checks pending RMAs:
  ```
  GET http://localhost:4000/api/rma/admin/pending
  ```
- Admin sees:
  - Serial number
  - Issue description
  - All attachments
  - User contact info

### **STEP 3: Admin Reviews & Takes Action**

**Option A: Approve RMA**
```bash
PUT http://localhost:4000/api/rma/{id}/approve
Body: {
  "approvedBy": "Admin Name",
  "notes": "Approved for repair",
  "estimatedReturnDate": "2025-12-15"
}
```

**Option B: Reject RMA**
```bash
PUT http://localhost:4000/api/rma/{id}/reject
Body: {
  "rejectedBy": "Admin Name",
  "rejectionReason": "Serial number not found"
}
```

### **STEP 4: Admin Processes RMA**
- Updates status as it progresses:
```bash
PUT http://localhost:4000/api/rma/{id}/status
Body: {
  "status": "in_transit_to_vendor",
  "updatedBy": "Admin Name",
  "notes": "Shipped via FedEx"
}
```

---

## 🔌 API Endpoints

### User Endpoints
```
POST /api/rma/submit          - Submit RMA with files
GET  /api/rma                 - Get all RMAs (with filters)
GET  /api/rma/:id             - Get specific RMA
GET  /api/rma/:id/download/:fileType/:index? - Download attachment
```

### Admin Endpoints
```
GET  /api/rma/admin/pending   - Get pending RMAs
PUT  /api/rma/:id/approve     - Approve RMA
PUT  /api/rma/:id/reject      - Reject RMA
PUT  /api/rma/:id/status      - Update RMA status
PUT  /api/rma/:id             - Update RMA details
DELETE /api/rma/:id           - Delete RMA
GET  /api/rma/stats/overview  - Get statistics
```

---

## 📁 File Upload Structure

Files are stored in: `uploads/rma/`

**Supported file types:**
- Images: JPG, PNG, GIF
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Max size: 10MB per file

---

## 🔔 Real-time Notifications

The system emits Socket.IO events:

```javascript
// When user submits RMA
socket.on('admin:newRMA', (data) => {
  console.log('New RMA:', data.rmaNumber);
});

// When admin approves/rejects
socket.on('notification', (data) => {
  console.log('RMA updated:', data.message);
});
```

---

## 🧪 Testing

### Test with the HTML Form:
1. Open `test-rma-form.html` in browser
2. Fill form and upload test files
3. Submit and check console for response

### Test with Postman/Thunder Client:
1. Create POST request to `http://localhost:4000/api/rma/submit`
2. Set body type to `form-data`
3. Add fields:
   - serialNumber: "TEST123"
   - rmaType: "repair"
   - issueDescription: "Not working"
   - reportedBy: "Test User"
4. Add files to `invoice`, `photos`, etc.
5. Send request

---

## 📊 Database Structure

### RMA Document Example:
```json
{
  "_id": "...",
  "rmaNumber": "RMA-202511-0001",
  "serialNumber": "SN12345",
  "deviceId": "...",
  "status": "pending_review",
  "rmaType": "repair",
  "issueDescription": "Screen not displaying",
  "reportedBy": "John Doe",
  "reportedByEmail": "john@example.com",
  "reportedByPhone": "+1234567890",
  "priority": "high",
  "attachments": {
    "invoice": {
      "filename": "invoice.pdf",
      "path": "uploads/rma/invoice-1234567890.pdf",
      "uploadedAt": "2025-11-28T..."
    },
    "photos": [...]
  },
  "isNewSubmission": true,
  "statusHistory": [...],
  "createdAt": "2025-11-28T...",
  "updatedAt": "2025-11-28T..."
}
```

---

## 🎯 Status Workflow

```
1. pending_review      → User submitted, waiting for admin
2. approved            → Admin approved
3. in_transit_to_vendor → Shipped to vendor
4. received_by_vendor  → Vendor received device
5. under_repair        → Being repaired
6. repaired            → Repair completed
7. in_transit_to_client → Shipping back
8. completed           → RMA closed

OR rejected/cancelled
```

---

## 💡 Frontend Integration Tips

### Submit RMA Form (React example):
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('serialNumber', serialNumber);
  formData.append('rmaType', rmaType);
  formData.append('issueDescription', description);
  formData.append('reportedBy', userName);
  
  // Add files
  if (invoice) formData.append('invoice', invoice);
  if (photos) {
    photos.forEach(photo => formData.append('photos', photo));
  }
  
  const response = await fetch('http://localhost:4000/api/rma/submit', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  console.log('RMA created:', data.rma.rmaNumber);
};
```

### Admin Dashboard (React example):
```javascript
// Get pending RMAs
const fetchPendingRMAs = async () => {
  const response = await fetch('http://localhost:4000/api/rma/admin/pending');
  const data = await response.json();
  setPendingRMAs(data.rmas);
};

// Approve RMA
const approveRMA = async (rmaId) => {
  await fetch(`http://localhost:4000/api/rma/${rmaId}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      approvedBy: adminName,
      notes: 'Approved for processing'
    })
  });
};
```

---

## 🔐 Security Recommendations

1. Add authentication middleware to all routes
2. Add admin role check for admin endpoints
3. Validate file uploads on server side
4. Scan files for malware
5. Add rate limiting
6. Use HTTPS in production
7. Sanitize user inputs

---

## 🎉 You're All Set!

The RMA system is fully functional and ready to use. Users can submit RMA requests with attachments, and admins can review and process them through the entire lifecycle.

**Next steps:**
1. Test the system using the HTML form
2. Build your frontend UI
3. Add authentication/authorization
4. Deploy to production

Happy coding! 🚀
