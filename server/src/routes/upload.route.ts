import { Router } from "express";
import { auth } from "../middlewares/authentication.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadMedia } from "../controllers/upload.controller.js";

const router = Router();

router.post("/media", auth, upload.single("file"), uploadMedia);
router.post("/image", auth, upload.single("image"), uploadMedia);

export default router;
