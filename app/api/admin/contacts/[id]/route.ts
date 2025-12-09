import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getContactById,
  updateContact,
  getContactNotes,
  getContactActivity,
  addContactNote,
  addTagToContact,
  removeTagFromContact,
} from '@/lib/crm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const contact = await getContactById(contactId);

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Get notes and activity
    const [notes, activity] = await Promise.all([
      getContactNotes(contactId),
      getContactActivity(contactId),
    ]);

    return NextResponse.json({
      contact,
      notes,
      activity,
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const body = await request.json();

    const contact = await updateContact(contactId, {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      company: body.company,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country,
      customFields: body.customFields,
      status: body.status,
      emailSubscribed: body.emailSubscribed,
      smsSubscribed: body.smsSubscribed,
    });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'add_note': {
        if (!body.note) {
          return NextResponse.json({ error: 'Note is required' }, { status: 400 });
        }
        const note = await addContactNote(
          contactId,
          body.note,
          body.noteType || 'general',
          session.user.id ? parseInt(session.user.id) : undefined,
          session.user.name || session.user.email || undefined
        );
        return NextResponse.json({ note });
      }

      case 'add_tag': {
        if (!body.tagSlug) {
          return NextResponse.json({ error: 'Tag slug is required' }, { status: 400 });
        }
        await addTagToContact(
          contactId,
          body.tagSlug,
          'manual',
          session.user.id ? parseInt(session.user.id) : undefined
        );
        const contact = await getContactById(contactId);
        return NextResponse.json({ contact });
      }

      case 'remove_tag': {
        if (!body.tagSlug) {
          return NextResponse.json({ error: 'Tag slug is required' }, { status: 400 });
        }
        await removeTagFromContact(contactId, body.tagSlug);
        const contact = await getContactById(contactId);
        return NextResponse.json({ contact });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing contact action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
