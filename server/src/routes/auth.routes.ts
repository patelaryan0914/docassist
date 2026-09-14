import { Router } from 'express';
import {
  signIn,
  signUp,
  signOut,
  refreshAccessToken,
  getMe,
  updateProfile,
} from '../controllers/auth.controller.js';
import {
  signInSchema,
  signUpSchema,
  updateProfileSchema,
} from '../utils/ValidationSchema.js';
import { validate } from '../middlewares/validate.middleware.js';
import { auth } from '../middlewares/authentication.middleware.js';

const router = Router();

router.route('/sign-up').post(validate(signUpSchema), signUp);

router.route('/sign-in').post(validate(signInSchema), signIn);

router.route('/refresh-token').get(refreshAccessToken);

router.route('/me').get(auth, getMe);

router.route('/profile').put(auth, validate(updateProfileSchema), updateProfile);

router.route('/sign-out').get(signOut);

export default router;
