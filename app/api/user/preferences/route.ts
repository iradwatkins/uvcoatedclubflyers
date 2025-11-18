import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.$queryRaw<any[]>`
      SELECT * FROM user_preferences
      WHERE user_id = ${parseInt(session.user.id)}
    `;

    // If no preferences exist, create default ones
    if (preferences.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO user_preferences (
          user_id, email_order_updates, email_promotions, email_newsletters,
          created_at, updated_at
        ) VALUES (
          ${parseInt(session.user.id)}, true, true, false, NOW(), NOW()
        )
      `;

      return NextResponse.json({
        preferences: {
          email_order_updates: true,
          email_promotions: true,
          email_newsletters: false,
        },
      });
    }

    return NextResponse.json({ preferences: preferences[0] });
  } catch (error) {
    console.error('Fetch preferences error:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email_order_updates, email_promotions, email_newsletters } = await request.json();

    // Check if preferences exist
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM user_preferences
      WHERE user_id = ${parseInt(session.user.id)}
    `;

    if (existing.length === 0) {
      // Create new preferences
      await prisma.$executeRaw`
        INSERT INTO user_preferences (
          user_id, email_order_updates, email_promotions, email_newsletters,
          created_at, updated_at
        ) VALUES (
          ${parseInt(session.user.id)},
          ${email_order_updates},
          ${email_promotions},
          ${email_newsletters},
          NOW(),
          NOW()
        )
      `;
    } else {
      // Update existing preferences
      await prisma.$executeRaw`
        UPDATE user_preferences
        SET email_order_updates = ${email_order_updates},
            email_promotions = ${email_promotions},
            email_newsletters = ${email_newsletters},
            updated_at = NOW()
        WHERE user_id = ${parseInt(session.user.id)}
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
