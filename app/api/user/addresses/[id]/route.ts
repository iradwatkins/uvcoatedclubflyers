import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
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

    // Verify address belongs to user
    const existingAddress = await prisma.$queryRaw<any[]>`
      SELECT id FROM saved_addresses
      WHERE id = ${parseInt(id)}
      AND user_id = ${parseInt(session.user.id)}
    `;

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await prisma.$executeRaw`
        UPDATE saved_addresses
        SET is_default = false
        WHERE user_id = ${parseInt(session.user.id)}
        AND id != ${parseInt(id)}
      `;
    }

    // Update address
    await prisma.$executeRaw`
      UPDATE saved_addresses
      SET label = ${label},
          full_name = ${full_name},
          address_line1 = ${address_line1},
          address_line2 = ${address_line2 || null},
          city = ${city},
          state = ${state},
          zip_code = ${zip_code},
          phone = ${phone || null},
          is_default = ${is_default},
          updated_at = NOW()
      WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
    });
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify address belongs to user
    const existingAddress = await prisma.$queryRaw<any[]>`
      SELECT id FROM saved_addresses
      WHERE id = ${parseInt(id)}
      AND user_id = ${parseInt(session.user.id)}
    `;

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Delete address
    await prisma.$executeRaw`
      DELETE FROM saved_addresses
      WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
