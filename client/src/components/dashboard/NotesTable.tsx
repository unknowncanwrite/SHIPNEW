import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ArrowUpDown, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes';

interface NotesTableProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotesTable({ open, onOpenChange }: NotesTableProps) {
  const [newName, setNewName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, { name: string; notes: string }>>({});

  const { data: notes = [], isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  // Initialize edit values when notes load
  useEffect(() => {
    const values: Record<string, { name: string; notes: string }> = {};
    notes.forEach(note => {
      if (!editValues[note.id]) {
        values[note.id] = { name: note.name, notes: note.notes };
      }
    });
    if (Object.keys(values).length > 0) {
      setEditValues(prev => ({ ...prev, ...values }));
    }
  }, [notes]);

  const handleAddNote = () => {
    if (newName.trim() && newNote.trim()) {
      createNote.mutate(
        { name: newName, notes: newNote },
        {
          onSuccess: () => {
            setNewName('');
            setNewNote('');
          },
        }
      );
    }
  };

  const handleUpdateNote = (id: string, field: 'name' | 'notes', value: string) => {
    setEditValues(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleBlur = (id: string) => {
    const edited = editValues[id];
    const original = notes.find(n => n.id === id);
    
    if (edited && original && (edited.name !== original.name || edited.notes !== original.notes)) {
      updateNote.mutate({
        id,
        data: { name: edited.name, notes: edited.notes }
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteNote.mutate(id);
  };

  const sortedNotes = [...notes].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return sortAsc ? comparison : -comparison;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[40vw] max-w-2xl flex flex-col p-0">
        <SheetHeader className="border-b px-6 py-4 sticky top-0 bg-background">
          <div className="flex items-center justify-between w-full">
            <SheetTitle>Notes</SheetTitle>
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

        {/* Content */}
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
                    <th className="text-left px-6 py-2 text-xs font-semibold text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedNotes.map((note) => (
                    <tr key={note.id} className="border-b hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-2 text-xs">
                        <textarea
                          value={editValues[note.id]?.name ?? note.name}
                          onChange={(e) => handleUpdateNote(note.id, 'name', e.target.value)}
                          onBlur={() => handleBlur(note.id)}
                          className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 font-medium text-foreground placeholder-muted-foreground resize-none min-h-[1.5rem]"
                          placeholder="Name..."
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
                            value={editValues[note.id]?.notes ?? note.notes}
                            onChange={(e) => handleUpdateNote(note.id, 'notes', e.target.value)}
                            onBlur={() => handleBlur(note.id)}
                            className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder-muted-foreground resize-none min-h-[1.5rem]"
                            placeholder="Notes..."
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
                            onClick={() => handleDelete(note.id)}
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

        {/* Add New Note */}
        <div className="bg-muted/5 px-6 py-4 border-t space-y-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Note name..."
            className="h-8 text-xs"
            disabled={createNote.isPending}
          />
          <div className="flex gap-2">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !createNote.isPending && handleAddNote()}
              placeholder="Add note..."
              className="h-8 text-xs flex-1"
              disabled={createNote.isPending}
            />
            <Button
              onClick={handleAddNote}
              className="bg-accent hover:bg-accent/90 text-white h-8 px-2"
              size="sm"
              disabled={createNote.isPending}
            >
              {createNote.isPending ? (
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
