import { Router } from 'express';
import {
  signIn,
  signUp,
  signOut,
  googleAuthCallback,
} from '../controllers/auth.controller.js';
import {
  signInSchema,
  signUpSchema,
} from '../utils/ValidationSchema.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.route('/sign-up').post(validate(signUpSchema), signUp);

router.route('/sign-in').post(validate(signInSchema), signIn);

router.route('/callback/google').get(googleAuthCallback);

router.route('/sign-out').get(signOut);

export default router;
