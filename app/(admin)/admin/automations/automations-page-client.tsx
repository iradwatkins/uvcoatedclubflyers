'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Mail,
  Tag,
  Clock,
  ArrowRight,
  Play,
  Pause,
  MoreHorizontal,
  Plus,
  Activity,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AutomationEvent, AutomationAction } from '@/lib/crm/types';

interface AutomationsPageClientProps {
  initialEvents: AutomationEvent[];
}

const eventTypeLabels: Record<string, { label: string; description: string }> = {
  order_created: {
    label: 'Order Created',
    description: 'Triggered when a new order is placed',
  },
  order_completed: {
    label: 'Order Completed',
    description: 'Triggered when an order is marked complete',
  },
  order_shipped: {
    label: 'Order Shipped',
    description: 'Triggered when an order is shipped',
  },
  contact_created: {
    label: 'Contact Created',
    description: 'Triggered when a new contact is added',
  },
  cart_abandoned: {
    label: 'Cart Abandoned',
    description: 'Triggered when a cart is abandoned',
  },
  days_after_order: {
    label: 'Days After Order',
    description: 'Triggered X days after an order',
  },
  days_since_last_order: {
    label: 'Win-back',
    description: 'Triggered when customer hasn\'t ordered in X days',
  },
};

const actionTypeIcons: Record<string, typeof Mail> = {
  send_email: Mail,
  add_tag: Tag,
  remove_tag: Tag,
  wait: Clock,
};

export function AutomationsPageClient({ initialEvents }: AutomationsPageClientProps) {
  const [events, setEvents] = useState<AutomationEvent[]>(initialEvents);

  const handleToggleActive = async (eventId: number, isActive: boolean) => {
    try {
      // TODO: Add API endpoint for updating automation events
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, isActive } : e))
      );
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group events by type
  const groupedEvents: Record<string, AutomationEvent[]> = {};
  events.forEach((event) => {
    if (!groupedEvents[event.eventType]) {
      groupedEvents[event.eventType] = [];
    }
    groupedEvents[event.eventType].push(event);
  });

  // Calculate stats
  const activeCount = events.filter((e) => e.isActive).length;
  const totalTriggered = events.reduce((sum, e) => sum + (e.timesTriggered || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing Automations</h1>
          <p className="text-muted-foreground">
            Set up automated workflows to engage customers
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Triggered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTriggered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Automation List */}
      <div className="space-y-4">
        {Object.entries(groupedEvents).map(([eventType, typeEvents]) => (
          <Card key={eventType}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <CardTitle className="text-lg">
                    {eventTypeLabels[eventType]?.label || eventType}
                  </CardTitle>
                  <CardDescription>
                    {eventTypeLabels[eventType]?.description || 'Custom event'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {typeEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={event.isActive}
                      onCheckedChange={(checked) =>
                        handleToggleActive(event.id, checked)
                      }
                    />
                    <div>
                      <div className="font-medium">{event.name}</div>
                      {event.description && (
                        <div className="text-sm text-muted-foreground">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Actions Preview */}
                    <div className="flex items-center gap-1">
                      {event.actions.slice(0, 3).map((action, i) => {
                        const Icon = actionTypeIcons[action.type] || Activity;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-1 text-muted-foreground"
                          >
                            {i > 0 && <ArrowRight className="h-3 w-3" />}
                            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                              <Icon className="h-3 w-3" />
                              {action.type.replace('_', ' ')}
                              {action.delayHours && action.delayHours > 0 && (
                                <span className="text-muted-foreground">
                                  ({action.delayHours}h)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {event.actions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{event.actions.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right text-sm">
                      <div className="font-medium">{event.timesTriggered || 0}</div>
                      <div className="text-muted-foreground text-xs">triggered</div>
                    </div>

                    {/* Status Badge */}
                    <Badge variant={event.isActive ? 'default' : 'secondary'}>
                      {event.isActive ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Paused
                        </>
                      )}
                    </Badge>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Automation</DropdownMenuItem>
                        <DropdownMenuItem>View Logs</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <Card className="p-8 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Automations Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first automation to start engaging customers automatically.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Automations Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                1
              </div>
              <div>
                <h4 className="font-medium">Trigger Event</h4>
                <p className="text-sm text-muted-foreground">
                  An event occurs (new order, cart abandoned, etc.)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                2
              </div>
              <div>
                <h4 className="font-medium">Check Conditions</h4>
                <p className="text-sm text-muted-foreground">
                  Conditions are verified (order value, customer type, etc.)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                3
              </div>
              <div>
                <h4 className="font-medium">Execute Actions</h4>
                <p className="text-sm text-muted-foreground">
                  Actions run (send email, add tag, wait, etc.)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
