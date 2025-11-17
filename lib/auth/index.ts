import NextAuth from 'next-auth';
import { authConfig } from './config';

const { auth: nextAuth, handlers, signIn, signOut } = NextAuth(authConfig);

export const auth = nextAuth;
export { handlers, signIn, signOut };

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function requireRole(role: string | string[]) {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }

  return user;
}
