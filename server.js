// Core dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Custom modules
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import categoryRoutes from "./src/routes/categoryRoutes.js";
import deviceRoutes from "./src/routes/deviceRoutes.js";
import vendorRoutes from "./src/routes/vendorRoutes.js";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// CORS Configuration - Updated for production
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL || 'https://assetsmanagement.onrender.com/', // Add your deployed frontend URL
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions)); // Enable Cross-Origin requests with specific origins
app.use(express.json()); // Parse incoming JSON bodies
app.use(morgan('dev')); // Log all HTTP requests (useful in dev mode)

// Content Security Policy headers (Fix CSP error)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  next();
});

// Root route
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.status(200).json({
    success: true,
    message: '✅ API is running securely...',
    endpoints: {
      auth: '/api/auth',
      categories: '/api/categories',
      devices: '/api/devices',
      vendors: '/api/vendors'
    }
  });
});

// Health check route (for Render)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use("/api/categories", categoryRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/vendors", vendorRoutes);

// Optional: Add route aliases without /api prefix (if you want both to work)
// Uncomment these if you want /devices to work in addition to /api/devices
// app.use('/devices', deviceRoutes);
// app.use('/categories', categoryRoutes);
// app.use('/vendors', vendorRoutes);
// app.use('/auth', authRoutes);

// 404 Route Handler - Improved error message
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/api/auth', '/api/categories', '/api/devices', '/api/vendors']
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err.stack,
  });
});

// Server listening
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🌍 Server URL: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  console.error(err.stack);
  // Close server & exit process
  process.exit(1);
});