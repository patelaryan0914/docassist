import { Router } from "express";
import { auth } from "../middlewares/authentication.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createMessageSchema } from "../utils/ValidationSchema";
import {
    createMessage,
    getMessagesByConversation,
} from "../controllers/message.controller";

const router = Router();

router
    .route("/:conversationId")
    .get(auth, getMessagesByConversation)
router
    .route("/")
    .post(auth, validate(createMessageSchema), createMessage);

export default router;

