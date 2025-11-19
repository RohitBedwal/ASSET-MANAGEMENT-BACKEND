// Core dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';

// Custom modules
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import categoryRoutes from "./src/routes/categoryRoutes.js";
import deviceRoutes from "./src/routes/deviceRoutes.js";
import vendorRoutes from "./src/routes/vendorRoutes.js"; // ✅ Added

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin requests
app.use(express.json()); // Parse incoming JSON bodies
app.use(morgan('dev')); // Log all HTTP requests (useful in dev mode)

// Root route
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.status(200).send('✅ API is running securely...');
});

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use("/api/categories", categoryRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/vendors", vendorRoutes); // ✅ New Vendors API route added

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message,
  });
});

// Server listening
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
