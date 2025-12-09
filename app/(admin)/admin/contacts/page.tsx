import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ContactsPageClient } from './contacts-page-client';
import { getContacts, getContactStats, getTags } from '@/lib/crm';

async function getContactsData() {
  const [{ contacts, total }, stats, tags] = await Promise.all([
    getContacts({ page: 1, limit: 50 }),
    getContactStats(),
    getTags(),
  ]);
  return { contacts, total, stats, tags };
}

function ContactsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 bg-muted animate-pulse rounded" />
      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-[500px] bg-muted animate-pulse rounded" />
    </div>
  );
}

export default async function AdminContactsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  const { contacts, total, stats, tags } = await getContactsData();

  return (
    <Suspense fallback={<ContactsLoading />}>
      <ContactsPageClient
        initialContacts={contacts}
        initialTotal={total}
        initialStats={stats}
        availableTags={tags}
      />
    </Suspense>
  );
}
