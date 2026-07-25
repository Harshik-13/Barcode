import express from 'express';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/requestLogger';
import { securityHeaders } from './middleware/securityHeaders';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import studentRoutes from './routes/students';
import sessionRoutes from './routes/sessions';
import scanRoutes from './routes/scan';
import activityLogRoutes from './routes/activityLogs';
import notificationRoutes from './routes/notifications';
import pushRoutes from './routes/push';
import activationRoutes from './routes/activation';
import facultyRoutes from './routes/faculty';
import facultyActivationRoutes from './routes/facultyActivation';
import dashboardRoutes from './routes/dashboard';

const app = express();

app.use(cors({ origin: config.cors.origins }));
app.use(express.json({ limit: '1mb' }));
app.use(securityHeaders);
app.use(requestLogger);
app.use(globalLimiter);

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', categoryRoutes);
app.use('/api', studentRoutes);
app.use('/api', sessionRoutes);
app.use('/api', scanRoutes);
app.use('/api', activityLogRoutes);
app.use('/api', notificationRoutes);
app.use('/api', pushRoutes);
app.use('/api', activationRoutes);
app.use('/api', facultyRoutes);
app.use('/api', facultyActivationRoutes);
app.use('/api', dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

app.use(errorHandler);

export default app;
