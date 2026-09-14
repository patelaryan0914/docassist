import { Router } from "express";
import { auth } from "../middlewares/authentication.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    classifyDocumentationSchema,
    createMessageSchema,
} from "../utils/ValidationSchema.js";
import {
    classifyDocumentation,
    createMessage,
    getMessagesByConversation,
} from "../controllers/message.controller.js";

const router = Router();

router
    .route("/classify")
    .post(auth, validate(classifyDocumentationSchema), classifyDocumentation);
router
    .route("/:conversationId")
    .get(auth, getMessagesByConversation)
router
    .route("/")
    .post(auth, validate(createMessageSchema), createMessage);

export default router;

