import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import type { CreateUserBody } from './schemas.js';

export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;

export function publicUser(u: User): PublicUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

export function authService(prisma: PrismaClient) {
  return {
    findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
    findById: (id: string) => prisma.user.findUnique({ where: { id } }),
    list: async (): Promise<PublicUser[]> =>
      (await prisma.user.findMany({ orderBy: { email: 'asc' } })).map(publicUser),
    async create(data: CreateUserBody): Promise<PublicUser> {
      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = await prisma.user.create({
        data: { email: data.email, name: data.name, role: data.role, passwordHash },
      });
      return publicUser(user);
    },
    verify: (password: string, hash: string) => bcrypt.compare(password, hash),
  };
}
