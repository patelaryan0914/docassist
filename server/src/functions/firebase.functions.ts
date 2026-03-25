import admin from "firebase-admin";
import path from "path";
import logger from "../utils/Logger.js";
import type { NotificationPayload } from "../utils/types.js";
import { fileURLToPath } from 'url';
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const serviceAccountPath = path.join(__dirname, `../../config/${process.env.FIREBASE_SERVICE_ACCOUNT_FILE_NAME!}`);
// const serviceAccount = JSON.parse(
//     fs.readFileSync(serviceAccountPath, "utf-8")
// );

let messaging: admin.messaging.Messaging | null = null;

function getMessaging() {
    if (messaging) return messaging;

    try {
        const serviceAccountPath = path.join(
            __dirname,
            `../../config/${process.env.FIREBASE_SERVICE_ACCOUNT_FILE_NAME}`
        );

        if (!fs.existsSync(serviceAccountPath)) {
            throw new Error(`Firebase service account not found: ${serviceAccountPath}`);
        }

        const serviceAccount = JSON.parse(
            fs.readFileSync(serviceAccountPath, "utf-8")
        );

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }

        messaging = admin.messaging();
        logger.info("🔥 Firebase Admin initialized");

        return messaging;
    } catch (err) {
        logger.error("❌ Firebase initialization failed", err);
        throw err;
    }
}


export async function sendNotificationMultiCast({
    tokens,
    title,
    body,
    image,
    data = {},
}: NotificationPayload) {
    if (!tokens || tokens.length === 0) {
        logger.warn("No FCM tokens provided");
        return;
    }
    const messaging = getMessaging();
    const BATCH_SIZE = 500;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        try {
            const message = {
                data,
                notification: {
                    title,
                    body,
                    image
                },
                tokens: batch

            };

            const response = await messaging.sendEachForMulticast(message);
            logger.info(`FCM sent: ${response.successCount}/${batch.length} successful`);
            response.responses.forEach((res, idx) => {
                if (
                    !res.success &&
                    res.error?.code === "messaging/registration-token-not-registered"
                ) {
                    logger.warn(`Invalid FCM token: ${batch[idx]}`);
                }
            });
        } catch (err) {
            logger.error("Error sending FCM batch", err);
        }
    }
}

export async function sendNotificationToOne({
    token,
    title,
    body,
    image,
    data = {},
}: {
    token: string;
    title: string;
    body: string;
    image?: string;
    data?: Record<string, string>;
}) {
    try {
        const message = {
            token,
            notification: {
                title,
                body,
                image,
            },
            data,
        };
        const messaging = getMessaging();
        const response = await messaging.send(message);
        logger.info(`FCM sent to single token: ${response}`);
    } catch (err: any) {
        if (
            err?.code === "messaging/registration-token-not-registered"
        ) {
            logger.warn(`Invalid FCM token: ${token}`);
        } else {
            logger.error("Error sending FCM to single token", err);
        }
    }
}
