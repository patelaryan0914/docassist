import { Router } from "express"
import {
    createConversation,
    getAllConversations,
    deleteConversation,
    updateConversation,
} from "../controllers/conversations.controller.js";
import { auth } from "../middlewares/authentication.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    createConversationSchema,
    updateConversationSchema,
} from "../utils/ValidationSchema.js";
const router = Router();

router.route("/")
    .get(auth, getAllConversations)
    .post(auth, validate(createConversationSchema), createConversation);

router.route("/:conversationId")
    .delete(auth, deleteConversation)
    .put(auth, validate(updateConversationSchema), updateConversation);

export default router;