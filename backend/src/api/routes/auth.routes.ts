import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { register, login } from '../controllers/auth.controller';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;