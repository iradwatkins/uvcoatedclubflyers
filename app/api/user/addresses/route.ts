import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.$queryRaw<any[]>`
      SELECT * FROM saved_addresses
      WHERE user_id = ${parseInt(session.user.id)}
      ORDER BY is_default DESC, created_at DESC
    `;

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Fetch addresses error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      label,
      full_name,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      phone,
      is_default,
    } = data;

    // If setting as default, unset other defaults
    if (is_default) {
      await prisma.$executeRaw`
        UPDATE saved_addresses
        SET is_default = false
        WHERE user_id = ${parseInt(session.user.id)}
      `;
    }

    // Insert new address
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO saved_addresses (
        user_id, label, full_name, address_line1, address_line2,
        city, state, zip_code, phone, is_default, created_at, updated_at
      ) VALUES (
        ${parseInt(session.user.id)},
        ${label},
        ${full_name},
        ${address_line1},
        ${address_line2 || null},
        ${city},
        ${state},
        ${zip_code},
        ${phone || null},
        ${is_default},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      id: result[0]?.id,
      message: 'Address added successfully',
    });
  } catch (error) {
    console.error('Add address error:', error);
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}
