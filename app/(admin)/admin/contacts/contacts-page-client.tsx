'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Search,
  Plus,
  Mail,
  Phone,
  Tag,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Contact, ContactTag, ContactStats, ContactStatus } from '@/lib/crm/types';

interface ContactsPageClientProps {
  initialContacts: Contact[];
  initialTotal: number;
  initialStats: ContactStats;
  availableTags: ContactTag[];
}

export function ContactsPageClient({
  initialContacts,
  initialTotal,
  initialStats,
  availableTags,
}: ContactsPageClientProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [total, setTotal] = useState(initialTotal);
  const [stats] = useState<ContactStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContactStatus>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Fetch contacts when filters change
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        if (search) params.set('search', search);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));

        const response = await fetch(`/api/admin/contacts?${params}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data.contacts);
          setTotal(data.total);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchContacts, 300);
    return () => clearTimeout(debounce);
  }, [search, statusFilter, selectedTags, page, limit]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalPages = Math.ceil(total / limit);

  const handleAddTag = async (contactId: number, tagSlug: string) => {
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_tag', tag: tagSlug }),
      });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTag = async (contactId: number, tagSlug: string) => {
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_tag', tag: tagSlug }),
      });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contact CRM</h1>
          <p className="text-muted-foreground">
            Manage contacts, tags, and customer relationships
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.withOrders} with orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalLifetimeValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats.averageLifetimeValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Tag className="h-4 w-4 mr-2" />
              Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {availableTags.map((tag) => (
              <DropdownMenuItem
                key={tag.slug}
                onClick={() => {
                  if (selectedTags.includes(tag.slug)) {
                    setSelectedTags(selectedTags.filter((t) => t !== tag.slug));
                  } else {
                    setSelectedTags([...selectedTags, tag.slug]);
                  }
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1">{tag.name}</span>
                  {selectedTags.includes(tag.slug) && (
                    <span className="text-primary">✓</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTags([])}
          >
            <X className="h-4 w-4 mr-1" />
            Clear tags
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {contacts.length} of {total} contacts
      </div>

      {/* Contacts Table */}
      <div className={`flex gap-4 ${selectedContact ? '' : ''}`}>
        <Card className={`flex-1 ${selectedContact ? 'w-2/3' : 'w-full'}`}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Contact</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Tags</th>
                    <th className="text-left px-4 py-3 font-medium">Orders</th>
                    <th className="text-left px-4 py-3 font-medium">Lifetime Value</th>
                    <th className="text-left px-4 py-3 font-medium">Last Order</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : contacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No contacts found
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className={`border-b hover:bg-muted/50 cursor-pointer ${
                          selectedContact?.id === contact.id ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => setSelectedContact(contact)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              contact.status === 'active'
                                ? 'default'
                                : contact.status === 'lead'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {contact.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {contact.tags?.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag.slug}
                                variant="outline"
                                style={{
                                  borderColor: tag.color,
                                  color: tag.color,
                                }}
                                className="text-xs"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {contact.tags && contact.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{contact.orderCount}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(contact.lifetimeValue || 0)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(contact.lastOrderAt)}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add Note
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Activity className="h-4 w-4 mr-2" />
                                View Activity
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Detail Panel */}
        {selectedContact && (
          <Card className="w-1/3 min-w-[350px]">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-lg">
                  {selectedContact.firstName} {selectedContact.lastName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContact(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-2xl font-bold">{selectedContact.orderCount}</div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-2xl font-bold">
                    {formatCurrency(selectedContact.lifetimeValue || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Lifetime Value</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Contact Info</h4>
                {selectedContact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedContact.phone}
                  </div>
                )}
                {selectedContact.company && (
                  <div className="text-sm text-muted-foreground">
                    {selectedContact.company}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Joined {formatDate(selectedContact.createdAt)}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedContact.tags?.map((tag) => (
                    <Badge
                      key={tag.slug}
                      variant="outline"
                      style={{
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                      className="text-xs cursor-pointer"
                      onClick={() => handleRemoveTag(selectedContact.id, tag.slug)}
                    >
                      {tag.name}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 px-2">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {availableTags
                        .filter(
                          (t) =>
                            !selectedContact.tags?.some((ct) => ct.slug === t.slug)
                        )
                        .map((tag) => (
                          <DropdownMenuItem
                            key={tag.slug}
                            onClick={() => handleAddTag(selectedContact.id, tag.slug)}
                          >
                            <div
                              className="h-3 w-3 rounded-full mr-2"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Email Stats */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Email Engagement</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted rounded p-2">
                    <div className="font-medium">{selectedContact.emailsSent}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="font-medium">{selectedContact.emailsOpened}</div>
                    <div className="text-xs text-muted-foreground">Opened</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="font-medium">{selectedContact.emailsClicked}</div>
                    <div className="text-xs text-muted-foreground">Clicked</div>
                  </div>
                </div>
              </div>

              {/* Subscription Status */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Subscriptions</h4>
                <div className="flex gap-2">
                  <Badge variant={selectedContact.emailSubscribed ? 'default' : 'secondary'}>
                    {selectedContact.emailSubscribed ? 'Email: Yes' : 'Email: No'}
                  </Badge>
                  <Badge variant={selectedContact.smsSubscribed ? 'default' : 'secondary'}>
                    {selectedContact.smsSubscribed ? 'SMS: Yes' : 'SMS: No'}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" className="flex-1" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
