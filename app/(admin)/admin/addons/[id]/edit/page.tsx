import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AddonForm } from '@/components/admin/addon-form';

interface EditAddonPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getAddon(id: number) {
  const addons = await prisma.$queryRaw`
    SELECT * FROM add_ons WHERE id = ${id} LIMIT 1
  `;

  if (addons.length === 0) {
    return null;
  }

  const subOptions = await prisma.$queryRaw`
    SELECT * FROM add_on_sub_options
    WHERE add_on_id = ${id}
    ORDER BY display_order
  `;

  return {
    addon: addons[0],
    subOptions,
  };
}

export default async function EditAddonPage({ params }: EditAddonPageProps) {
  const session = await auth();

  // Require authentication and admin role
  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const addonId = parseInt(id);

  const data = await getAddon(addonId);

  if (!data) {
    notFound();
  }

  // Transform addon data for form
  const initialData = {
    id: data.addon.id,
    name: data.addon.name,
    slug: data.addon.slug,
    description: data.addon.description,
    tooltipText: data.addon.tooltip_text,
    pricingModel: data.addon.pricing_model,
    basePrice: data.addon.base_price,
    perUnitPrice: data.addon.per_unit_price,
    percentage: data.addon.percentage,
    uiComponent: data.addon.ui_component,
    position: data.addon.position,
    displayOrder: data.addon.display_order,
    isMandatoryDefault: data.addon.is_mandatory_default,
    isEnabledDefault: data.addon.is_enabled_default,
    turnaroundDaysAdd: data.addon.turnaround_days_add,
    isActive: data.addon.is_active,
    adminNotes: data.addon.admin_notes,
  };

  return (
    <div className="container mx-auto py-10">
      <AddonForm mode="edit" initialData={initialData} initialSubOptions={data.subOptions} />
    </div>
  );
}
