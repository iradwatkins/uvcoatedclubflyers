import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getContacts, getContactStats, createContact, getTags } from '@/lib/crm';
import type { ContactListParams, ContactStatus } from '@/lib/crm/types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeStats = searchParams.get('includeStats') === 'true';
    const includeTags = searchParams.get('includeTags') === 'true';

    const params: ContactListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as ContactStatus | 'all') || 'all',
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
      sortBy: (searchParams.get('sortBy') as ContactListParams['sortBy']) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    const { contacts, total } = await getContacts(params);

    const response: {
      contacts: typeof contacts;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      stats?: Awaited<ReturnType<typeof getContactStats>>;
      tags?: Awaited<ReturnType<typeof getTags>>;
    } = {
      contacts,
      total,
      page: params.page!,
      limit: params.limit!,
      totalPages: Math.ceil(total / params.limit!),
    };

    if (includeStats) {
      response.stats = await getContactStats();
    }

    if (includeTags) {
      response.tags = await getTags();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const contact = await createContact({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      company: body.company,
      source: 'manual',
    });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
