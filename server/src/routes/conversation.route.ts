import { Router } from "express"
import {
    createConversation,
    getAllConversations,
    deleteConversation,
    updateConversation,
} from "../controllers/conversations.controller";
import { auth } from "../middlewares/authentication.middleware"
import { validate } from "../middlewares/validate.middleware";
import {
    createConversationSchema,
    updateConversationSchema,
} from "../utils/ValidationSchema";
const router = Router();

router.route("/")
    .get(auth, getAllConversations)
    .post(auth, validate(createConversationSchema), createConversation);

router.route("/:conversationId")
    .delete(auth, deleteConversation)
    .put(auth, validate(updateConversationSchema), updateConversation);

export default router;