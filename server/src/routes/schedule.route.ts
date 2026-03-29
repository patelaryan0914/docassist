import { Router } from "express";
import { auth } from "../middlewares/authentication.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createScheduleItemSchema } from "../utils/ValidationSchema.js";
import {
  completeScheduleItem,
  createScheduleItem,
  getUpcomingSchedule,
} from "../controllers/schedule.controller.js";

const router = Router();

router.get("/upcoming", auth, getUpcomingSchedule);
router.post("/", auth, validate(createScheduleItemSchema), createScheduleItem);
router.patch("/:id/complete", auth, completeScheduleItem);

export default router;
