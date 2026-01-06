import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ArrowUpDown, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts';

interface ContactsTableProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContactsTable({ open, onOpenChange }: ContactsTableProps) {
  const [newName, setNewName] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, { name: string; details: string }>>({});

  const { data: contacts = [], isLoading } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  useEffect(() => {
    const values: Record<string, { name: string; details: string }> = {};
    contacts.forEach(contact => {
      if (!editValues[contact.id]) {
        values[contact.id] = { name: contact.name, details: contact.details };
      }
    });
    if (Object.keys(values).length > 0) {
      setEditValues(prev => ({ ...prev, ...values }));
    }
  }, [contacts]);

  const handleAddContact = () => {
    if (newName.trim() && newDetails.trim()) {
      createContact.mutate(
        { name: newName, details: newDetails },
        {
          onSuccess: () => {
            setNewName('');
            setNewDetails('');
          },
        }
      );
    }
  };

  const handleUpdateContact = (id: string, field: 'name' | 'details', value: string) => {
    setEditValues(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleBlur = (id: string) => {
    const edited = editValues[id];
    const original = contacts.find(c => c.id === id);
    
    if (edited && original && (edited.name !== original.name || edited.details !== original.details)) {
      updateContact.mutate({
        id,
        data: { name: edited.name, details: edited.details }
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteContact.mutate(id);
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return sortAsc ? comparison : -comparison;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[40vw] max-w-2xl flex flex-col p-0">
        <SheetHeader className="border-b px-6 py-4 sticky top-0 bg-background">
          <div className="flex items-center justify-between w-full">
            <SheetTitle>Contacts</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSortAsc(!sortAsc)}
              title="Sort by name"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 sticky top-0">
                    <th className="text-left px-6 py-2 text-xs font-semibold text-muted-foreground">Name</th>
                    <th className="text-left px-6 py-2 text-xs font-semibold text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedContacts.map((contact) => (
                    <tr key={contact.id} className="border-b hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-2 text-xs">
                        <textarea
                          value={editValues[contact.id]?.name ?? contact.name}
                          onChange={(e) => handleUpdateContact(contact.id, 'name', e.target.value)}
                          onBlur={() => handleBlur(contact.id)}
                          className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 font-medium text-foreground placeholder-muted-foreground resize-none min-h-[1.5rem]"
                          placeholder="Name..."
                          data-testid={`input-contact-name-${contact.id}`}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = el.scrollHeight + 'px';
                            }
                          }}
                          rows={1}
                        />
                      </td>
                      <td className="px-6 py-2 text-xs">
                        <div className="flex items-start justify-between gap-1">
                          <textarea
                            value={editValues[contact.id]?.details ?? contact.details}
                            onChange={(e) => handleUpdateContact(contact.id, 'details', e.target.value)}
                            onBlur={() => handleBlur(contact.id)}
                            className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder-muted-foreground resize-none min-h-[1.5rem]"
                            placeholder="Details..."
                            data-testid={`input-contact-details-${contact.id}`}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }
                            }}
                            rows={1}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={() => handleDelete(contact.id)}
                            data-testid={`button-delete-contact-${contact.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-muted/5 px-6 py-4 border-t space-y-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Contact name..."
            className="h-8 text-xs"
            disabled={createContact.isPending}
            data-testid="input-new-contact-name"
          />
          <div className="flex gap-2">
            <Input
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !createContact.isPending && handleAddContact()}
              placeholder="Add details (email/phone)..."
              className="h-8 text-xs flex-1"
              disabled={createContact.isPending}
              data-testid="input-new-contact-details"
            />
            <Button
              onClick={handleAddContact}
              className="bg-accent hover:bg-accent/90 text-white h-8 px-2"
              size="sm"
              disabled={createContact.isPending}
              data-testid="button-add-contact"
            >
              {createContact.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
