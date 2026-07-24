import express from 'express';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/requestLogger';
import { securityHeaders } from './middleware/securityHeaders';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import studentRoutes from './routes/students';
import sessionRoutes from './routes/sessions';
import scanRoutes from './routes/scan';
import activityLogRoutes from './routes/activityLogs';
import notificationRoutes from './routes/notifications';

const app = express();

app.use(cors({ origin: config.cors.origins }));
app.use(express.json({ limit: '1mb' }));
app.use(securityHeaders);
app.use(requestLogger);
app.use(rateLimiter);

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', categoryRoutes);
app.use('/api', studentRoutes);
app.use('/api', sessionRoutes);
app.use('/api', scanRoutes);
app.use('/api', activityLogRoutes);
app.use('/api', notificationRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

app.use(errorHandler);

export default app;
