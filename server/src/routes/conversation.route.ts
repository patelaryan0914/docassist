import { Router } from "express"
import { createConversation, getAllConversations, deleteConversation, updateConversationName } from "../controllers/conversations.controller";
import { auth } from "../middlewares/authentication.middleware"
import { validate } from "../middlewares/validate.middleware";
import { createConversationSchema } from "../utils/ValidationSchema";
const router = Router();

router.route("/")
    .get(auth, getAllConversations)
    .post(auth, validate(createConversationSchema), createConversation);

router.route("/:conversationId")
    .delete(auth, deleteConversation)
    .put(auth, updateConversationName);

export default router;