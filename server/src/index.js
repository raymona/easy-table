import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import dotenv from 'dotenv';

import { setupSocket } from './socket.js';
import { errorHandler, notFound } from './utils/errors.js';
import authRoutes from './routes/auth.js';
import tableRoutes from './routes/tables.js';
import tabRoutes from './routes/tabs.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import billRoutes from './routes/bills.js';
import adminRoutes from './routes/admin.js';
import kdsRoutes from './routes/kds.js';
import menuRoutes from './routes/menu.js';
import floorRoutes from './routes/floor.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.io
const io = setupSocket(httpServer);
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim()),
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/tabs', tabRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/floor', floorRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Easy Table server running on port ${PORT}`);
});

export default app;
