import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Both current and new passwords are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get user's current password hash
    const users = await prisma.$queryRaw`
      SELECT password_hash FROM users
      WHERE id = ${parseInt(session.user.id)}
    `;

    const user = users[0];

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'User not found or password not set' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, 10);

    // Update password
    await prisma.$executeRaw`
      UPDATE users
      SET password_hash = ${newPasswordHash},
          updated_at = NOW()
      WHERE id = ${parseInt(session.user.id)}
    `;

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
