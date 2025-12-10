import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ChoiceForm } from '@/components/admin/choice-form';

interface PageProps {
  params: Promise<{ id: string; choiceId: string }>;
}

async function getChoice(addOnId: number, choiceId: number) {
  const result = await prisma.$queryRaw<any[]>`
    SELECT c.*, a.name as add_on_name
    FROM add_on_choices c
    JOIN add_ons a ON a.id = c.add_on_id
    WHERE c.id = ${choiceId} AND c.add_on_id = ${addOnId}
  `;
  return result[0] || null;
}

export default async function EditChoicePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  const { id, choiceId } = await params;
  const addOnId = parseInt(id);
  const choiceIdNum = parseInt(choiceId);

  if (isNaN(addOnId) || isNaN(choiceIdNum)) {
    notFound();
  }

  const choice = await getChoice(addOnId, choiceIdNum);

  if (!choice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/addons/${addOnId}/choices`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Choices
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Choice</h1>
          <p className="text-muted-foreground">
            Editing "{choice.label}" for <strong>{choice.add_on_name}</strong>
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Choice Details</CardTitle>
          <CardDescription>Update the configuration for this choice</CardDescription>
        </CardHeader>
        <CardContent>
          <ChoiceForm
            addOnId={addOnId}
            initialData={choice}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
