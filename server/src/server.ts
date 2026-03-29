import express, { urlencoded, json } from 'express';
import cors from 'cors';
import { requestLogger } from './middlewares/logger.middleware.js';
import { notFound, error } from './middlewares/error.middleware.js';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/Logger.js';
import { connectDB } from './utils/DB.js';
import http from 'http';
import cookieParser from 'cookie-parser';
//Routes
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import conversationRoutes from './routes/conversation.route.js';
import messageRoutes from './routes/message.route.js';
import uploadRoutes from './routes/upload.route.js';
import scheduleRoutes from './routes/schedule.route.js';
import dotenv from "dotenv";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const dir = path.join(__dirname, '../public/images');
dotenv.config({ path: path.join(__dirname, '../.env.dev') });
const mode = process.env.APP_MODE || 'api';
app.use(
    cors({
        origin: ['http://localhost:3000', "https://docassist.aryan-dev.in"],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
        credentials: true,
    }),
);
app.use(cookieParser());

app.use(express.static(dir));

app.use(urlencoded({ extended: true }));
app.use(json());

app.use(requestLogger);

app.use('/v1/api', healthRoutes);
app.use('/v1/api/auth', authRoutes);
app.use('/v1/api/conversation', conversationRoutes);
app.use('/v1/api/messages', messageRoutes);
app.use('/v1/api/upload', uploadRoutes);
app.use('/v1/api/schedule', scheduleRoutes);

app.use(notFound);

app.use(error);

const server = http.createServer(app);

const startServer = async () => {
    try {
        await connectDB();
        server.listen(process.env.PORT, () => {
            logger.info(`DocAssist Server running on port ${process.env.PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
if (mode === 'api') {
    startServer();
}
