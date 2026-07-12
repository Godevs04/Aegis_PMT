import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import errorHandler from './middlewares/error';
import sendResponse from './shared/utils/response';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import workspaceRoutes from './modules/workspaces/workspace.routes';
import projectRoutes from './modules/projects/project.routes';
import taskRoutes from './modules/tasks/task.routes';
import activityRoutes from './modules/activities/activity.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import roleRoutes from './modules/roles/role.routes';
import auditLogRoutes from './modules/audit-logs/audit-log.routes';
import taskStatusRoutes from './modules/task-statuses/task-status.routes';
import taskPriorityRoutes from './modules/task-priorities/task-priority.routes';
import attachmentRoutes from './modules/attachments/attachment.routes';
import organizationRoutes from './modules/organizations/organization.routes';
import commentRoutes, { commentStandaloneRoutes } from './modules/comments/comment.routes';
import teamRoutes from './modules/teams/team.routes';
import sprintRoutes from './modules/sprints/sprint.routes';
import milestoneRoutes from './modules/milestones/milestone.routes';
import searchRoutes from './modules/search/search.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import adminRoutes from './modules/admin/admin.routes';

const app: Application = express();

// Secure headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/workspaces/:workspaceId/statuses', taskStatusRoutes);
app.use('/api/workspaces/:workspaceId/priorities', taskPriorityRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/tasks/:taskId/comments', commentRoutes);
app.use('/api/comments', commentStandaloneRoutes());
app.use('/api/teams', teamRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  sendResponse({
    res,
    statusCode: 200,
    success: true,
    message: 'API server is running and healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
