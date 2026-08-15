import { Role } from '@prisma/client';
import { z } from 'zod';

export const loginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof loginBody>;

export const createUserBody = z.object({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(Role).default('ANALYST'),
});
export type CreateUserBody = z.infer<typeof createUserBody>;
