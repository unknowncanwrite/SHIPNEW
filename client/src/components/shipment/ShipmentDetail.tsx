import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useShipment, useUpdateShipment, useDeleteShipment } from '@/hooks/useShipments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Trash2, Printer, Moon, Sun, Clock, AlertCircle, Plus, X, Download, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PhaseSection from './PhaseSection';
import DonutProgress from './DonutProgress';
import { useTheme } from 'next-themes';
import { printDeclaration, printUndertaking, printShoesUndertaking } from '@/lib/PrintTemplates';
import { format } from 'date-fns';
import { calculateProgress, calculatePhaseProgress, getIncompleteTasks } from '@/lib/shipment-utils';
import { PHASE_1_TASKS, PHASE_2_TASKS, PHASE_3_TASKS, PHASE_5_TASKS, getForwarderTasks, getFumigationTasks, TaskDefinition } from '@/lib/shipment-definitions';
import { ShipmentData } from '@/types/shipment';
import type { Shipment } from '@shared/schema';

// Debounce hook for text input - fixed to prevent hook dependency issues
const useDebouncedSave = (value: string, delay: number, onSave: (val: string) => void) => {
  const onSaveRef = useRef(onSave);
  
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);
  
  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => {
      onSaveRef.current(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
};

// Sub-component that safely receives non-null shipment data
function ShipmentDetailContent({ currentShipment: inputShipment }: { currentShipment: Shipment }) {
  // Ensure currentShipment always has documents and shipmentChecklist
  const currentShipment = { ...inputShipment, documents: inputShipment.documents || [], shipmentChecklist: inputShipment.shipmentChecklist || [] };
  
  const [_, setLocation] = useLocation();
  const updateShipment = useUpdateShipment();
  const deleteShipmentMutation = useDeleteShipment();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const isSaving = updateShipment.isPending;
  
  // Local states for all text input fields (prevents re-render during typing)
  const [details, setDetails] = useState(currentShipment.details);
  const [commercial, setCommercial] = useState(currentShipment.commercial);
  const [actual, setActual] = useState(currentShipment.actual);
  const [manualFumigationName, setManualFumigationName] = useState(currentShipment.manualFumigationName);
  const [manualForwarderName, setManualForwarderName] = useState(currentShipment.manualForwarderName);
  
  // Sync when shipment changes (on load or when switching shipments)
  useEffect(() => {
    setDetails(currentShipment.details);
    setCommercial(currentShipment.commercial);
    setActual(currentShipment.actual);
    setManualFumigationName(currentShipment.manualFumigationName);
    setManualForwarderName(currentShipment.manualForwarderName);
  }, [currentShipment.id]);
  
  // Debounced saves for all sections
  const saveFn = useCallback((section: string, data: any) => {
    if (section === 'details' && JSON.stringify(data) !== JSON.stringify(currentShipment.details)) {
      updateShipment.mutate({ id: currentShipment.id, data: { details: data } });
    } else if (section === 'commercial' && JSON.stringify(data) !== JSON.stringify(currentShipment.commercial)) {
      updateShipment.mutate({ id: currentShipment.id, data: { commercial: data } });
    } else if (section === 'actual' && JSON.stringify(data) !== JSON.stringify(currentShipment.actual)) {
      updateShipment.mutate({ id: currentShipment.id, data: { actual: data } });
    }
  }, [currentShipment, updateShipment]);
  
  useDebouncedSave(JSON.stringify(details), 800, (val) => saveFn('details', JSON.parse(val)));
  useDebouncedSave(JSON.stringify(commercial), 800, (val) => saveFn('commercial', JSON.parse(val)));
  useDebouncedSave(JSON.stringify(actual), 800, (val) => saveFn('actual', JSON.parse(val)));
  
  useDebouncedSave(manualFumigationName || '', 800, (val) => {
    if (val !== currentShipment.manualFumigationName) {
      updateShipment.mutate({ id: currentShipment.id, data: { manualFumigationName: val } });
    }
  });
  
  useDebouncedSave(manualForwarderName || '', 800, (val) => {
    if (val !== currentShipment.manualForwarderName) {
      updateShipment.mutate({ id: currentShipment.id, data: { manualForwarderName: val } });
    }
  });
  
  const handleDetailChange = (field: string, value: any) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCommercialChange = (field: string, value: any) => {
    setCommercial(prev => ({ ...prev, [field]: value }));
  };
  
  const handleActualChange = (field: string, value: any) => {
    setActual(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      deleteShipmentMutation.mutate(currentShipment.id, {
        onSuccess: () => {
          setLocation('/');
          toast({ title: 'Shipment Deleted', variant: 'destructive' });
        },
      });
    }
  };

  const handlePrint = (type: 'declaration' | 'undertaking' | 'shoes') => {
    let content = '';
    if (type === 'declaration') content = printDeclaration(currentShipment as any);
    else if (type === 'undertaking') content = printUndertaking(currentShipment as any);
    else if (type === 'shoes') content = printShoesUndertaking(currentShipment as any);

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(content);
      win.document.close();
    }
  };

  const handleAddCustomTask = () => {
    if (newTaskInput.trim()) {
      const newTask = {
        id: Math.random().toString(36).substr(2, 9),
        text: newTaskInput.trim(),
        completed: false,
      };
      updateShipment.mutate({
        id: currentShipment.id,
        data: { customTasks: [...currentShipment.customTasks, newTask] }
      });
      setNewTaskInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only.');
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file only.",
        variant: "destructive"
      });
      return;
    }

    setUploadProgress(0);
    setUploadError(null);

    try {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 50);
          setUploadProgress(percentComplete);
        }
      };

      const base64Content = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const base64 = result.replace(/^data:application\/pdf;base64,/, '');
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsDataURL(file);
      });

      setUploadProgress(50);

      const docName = newDocName.trim() || file.name.replace('.pdf', '');
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `${docName}.pdf`,
          mimeType: 'application/pdf',
          fileContent: base64Content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload to Google Drive');
      }

      const driveFile = await response.json();
      
      const newDocument = {
        id: driveFile.id,
        name: docName,
        file: driveFile.webViewLink,
        createdAt: Date.now(),
      };
      
      updateShipment.mutate({
        id: currentShipment.id,
        data: { documents: [...currentShipment.documents, newDocument] }
      });
      
      setNewDocName('');
      (e.target as HTMLInputElement).value = '';
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(null);
        toast({
          title: "Document Uploaded",
          description: `${docName} has been uploaded to Google Drive.`,
        });
      }, 300);
    } catch (error) {
      setUploadError('Error uploading file');
      setUploadProgress(null);
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading the file.",
        variant: "destructive"
      });
    }
  };

  // Action helpers using mutation API
  const toggleChecklist = useCallback((key: string, value?: boolean | string) => {
    // We must use a function update or read the latest state carefully
    // Since we're using React Query, we should use the data from the currentShipment prop
    const currentChecklist = currentShipment.checklist || {};
    const newValue = value !== undefined ? value : !currentChecklist[key];
    
    // Optimization: Don't mutate if value is same
    if (currentChecklist[key] === newValue) return;

    const newChecklist = { ...currentChecklist, [key]: newValue };
    
    updateShipment.mutate({ 
      id: currentShipment.id, 
      data: { checklist: newChecklist } 
    });
  }, [currentShipment.id, currentShipment.checklist, updateShipment]);

  const toggleCustomTask = (id: string, taskId: string) => {
    const newCustomTasks = currentShipment.customTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateShipment.mutate({ id, data: { customTasks: newCustomTasks } });
  };

  const deleteCustomTask = (id: string, taskId: string) => {
    const newCustomTasks = currentShipment.customTasks.filter(t => t.id !== taskId);
    updateShipment.mutate({ id, data: { customTasks: newCustomTasks } });
  };

  const deleteDocument = (id: string, documentId: string) => {
    const newDocuments = currentShipment.documents.filter(d => d.id !== documentId);
    updateShipment.mutate({ id, data: { documents: newDocuments } });
  };

  const toggleShipmentChecklistItem = (id: string, itemId: string) => {
    const newShipmentChecklist = currentShipment.shipmentChecklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateShipment.mutate({ id, data: { shipmentChecklist: newShipmentChecklist } });
  };

  const addShipmentChecklistItem = (id: string, itemText: string) => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      item: itemText,
      completed: false,
    };
    updateShipment.mutate({ 
      id, 
      data: { shipmentChecklist: [...(currentShipment.shipmentChecklist || []), newItem] } 
    });
  };

  const deleteShipmentChecklistItem = (id: string, itemId: string) => {
    const newShipmentChecklist = currentShipment.shipmentChecklist.filter(item => item.id !== itemId);
    updateShipment.mutate({ id, data: { shipmentChecklist: newShipmentChecklist } });
  };

  const [remarksInput, setRemarksInput] = useState('');
  const toggleRemarksItem = (id: string, itemId: string) => {
    const newRemarks = (currentShipment.checklist?.remarks_list || []).map((item: any) => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateShipment.mutate({ id, data: { checklist: { ...currentShipment.checklist, remarks_list: newRemarks } } });
  };

  const addRemarksItem = (id: string, itemText: string) => {
    if (!itemText.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      item: itemText.trim(),
      completed: false,
    };
    const currentRemarks = currentShipment.checklist?.remarks_list || [];
    updateShipment.mutate({ 
      id, 
      data: { checklist: { ...currentShipment.checklist, remarks_list: [...currentRemarks, newItem] } } 
    });
  };

  const deleteRemarksItem = (id: string, itemId: string) => {
    const newRemarks = (currentShipment.checklist?.remarks_list || []).filter((item: any) => item.id !== itemId);
    updateShipment.mutate({ id, data: { checklist: { ...currentShipment.checklist, remarks_list: newRemarks } } });
  };

  // Countdown Logic
  const countdown = useMemo(() => {
    if (!currentShipment.details.inspectionDate) {
      return { text: 'Set Inspection Date', color: 'text-muted-foreground', bg: 'bg-muted', icon: Clock };
    }
    const target = new Date(currentShipment.details.inspectionDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    target.setHours(0,0,0,0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Passed', color: 'text-muted-foreground', bg: 'bg-muted', icon: Clock };
    if (diffDays === 0) return { text: 'Inspection Today!', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertCircle };
    if (diffDays <= 5) return { text: `${diffDays} Days Remaining`, color: 'text-warning', bg: 'bg-warning/10', icon: Clock };
    return { text: `${diffDays} Days Remaining`, color: 'text-primary', bg: 'bg-primary/10', icon: Clock };
  }, [currentShipment.details.inspectionDate]);

  const progress = calculateProgress(currentShipment);
  const incompleteTasks = useMemo(() => getIncompleteTasks(currentShipment), [currentShipment]);

  const getPhaseForTask = (taskId: string): string => {
    // Check which phase the task belongs to
    if (phase1Mapped.some(t => t.id === taskId)) return 'phase-1';
    if (fumigationMapped.some(t => t.id === taskId)) return 'phase-2';
    if (phase3Mapped.some(t => t.id === taskId)) return 'phase-3';
    if (forwarderMapped.some(t => t.id === taskId)) return 'phase-4';
    if (phase5Mapped.some(t => t.id === taskId)) return 'phase-5';
    return 'phases-section';
  };

  const handleScrollToMissed = (taskId?: string) => {
    const targetPhase = taskId ? getPhaseForTask(taskId) : 'phases-section';
    const phasesSection = document.getElementById(targetPhase);
    if (phasesSection) {
      phasesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper to map tasks with dynamic email content
  const mapTasks = (tasks: TaskDefinition[], data: ShipmentData) => {
    return tasks.map(t => ({
      ...t,
      emailSubject: typeof t.emailSubject === 'function' ? t.emailSubject(data) : t.emailSubject,
      emailBody: typeof t.emailBody === 'function' ? t.emailBody(data) : t.emailBody,
      emailTo: typeof t.emailTo === 'function' ? t.emailTo(data) : t.emailTo,
      emailCC: typeof t.emailCC === 'function' ? t.emailCC(data) : t.emailCC,
      whatsappBody: typeof t.whatsappBody === 'function' ? t.whatsappBody(data) : t.whatsappBody,
      onToggle: (checked: boolean) => toggleChecklist(t.id, checked),
      onSubTaskToggle: (taskId: string, subTaskIdx: number, checked: boolean) => {
        const key = subTaskIdx === 999 ? `${taskId}_subtask_confirm` : `${taskId}_subtask_${subTaskIdx}`;
        toggleChecklist(key, checked);
      }
    }));
  };

  const phase1Mapped = useMemo(() => mapTasks(PHASE_1_TASKS, currentShipment), [currentShipment]);
  const phase2Mapped = useMemo(() => mapTasks(PHASE_2_TASKS, currentShipment), [currentShipment]);
  const phase3Mapped = useMemo(() => mapTasks(PHASE_3_TASKS, currentShipment), [currentShipment]);
  const forwarderMapped = useMemo(() => mapTasks(getForwarderTasks(currentShipment), currentShipment), [currentShipment]);
  const fumigationMapped = useMemo(() => mapTasks(getFumigationTasks(currentShipment), currentShipment), [currentShipment]);
  const phase5Mapped = useMemo(() => mapTasks(PHASE_5_TASKS, currentShipment), [currentShipment]);

  const remarksContext = {
    list: currentShipment.checklist?.remarks_list || [],
    input: remarksInput,
    setInput: setRemarksInput,
    onAdd: (text: string) => {
      addRemarksItem(currentShipment.id, text);
      setRemarksInput('');
    },
    onToggle: (itemId: string) => toggleRemarksItem(currentShipment.id, itemId),
    onDelete: (itemId: string) => deleteRemarksItem(currentShipment.id, itemId)
  };

  const getForwarderDisplayName = () => {
    if (currentShipment.forwarder === 'xpo') return 'XPO Logistics';
    if (currentShipment.forwarder === 'hmi') return 'HMI Logistics';
    return currentShipment.manualForwarderName || 'Forwarder';
  };

  const getFumigationDisplayName = () => {
    if (currentShipment.fumigation === 'sky-services') return 'Sky Services';
    if (currentShipment.fumigation === 'sgs') return 'SGS';
    return currentShipment.manualFumigationName || 'Fumigation';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold flex items-center gap-2">
              {currentShipment.id}
              <Badge variant={progress === 100 ? 'default' : 'secondary'} className={progress === 100 ? 'bg-success' : ''}>
                {progress === 100 ? 'Completed' : 'In Progress'}
              </Badge>
            </h1>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="flex justify-between text-xs mb-1 text-muted-foreground">
            <span>Overall Progress</span>
            <div className="flex items-center gap-3">
              <span>{progress}%</span>
              {incompleteTasks.length > 0 && (
                <span className="text-warning font-semibold flex items-center gap-1">
                  <span className="text-lg">⚠</span> {incompleteTasks.length} Missed
                </span>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-muted-foreground mr-2 flex items-center gap-1">
            {isSaving ? (
              <span className="animate-pulse text-accent">Saving...</span>
            ) : (
              <span className="text-success flex items-center gap-1"><Save className="h-3 w-3" /> Saved</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left Widgets Column */}
            <div className="md:col-span-1 space-y-6">
                {/* Donut Chart Widget */}
                <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleScrollToMissed()}>
                    <DonutProgress percentage={progress} missedCount={incompleteTasks.length} />
                </div>

                {/* Missed Tasks Widget */}
                {incompleteTasks.length > 0 && (
                  <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Missed Tasks ({incompleteTasks.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {incompleteTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="text-xs p-2 bg-muted/30 rounded border-l-2 border-l-warning cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleScrollToMissed(task.id)}
                        >
                          <div className="font-medium text-foreground">{task.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-3 text-center">Click any task to view</div>
                  </div>
                )}

                {/* Countdown Widget */}
                <div className={`p-6 rounded-lg border shadow-sm flex flex-col items-center justify-center gap-2 ${countdown.bg}`}>
                    <countdown.icon className={`h-8 w-8 ${countdown.color}`} />
                    <span className={`text-lg font-bold ${countdown.color}`}>{countdown.text}</span>
                    {currentShipment.details.inspectionDate && (
                         <span className="text-xs text-muted-foreground">
                             Target: {format(new Date(currentShipment.details.inspectionDate), 'MMM d, yyyy')}
                         </span>
                    )}
                </div>



                {/* Controls */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Configuration</h3>
                    
                    <div className="space-y-3">
                        <Label>Shipment Type</Label>
                        <RadioGroup 
                            value={currentShipment.shipmentType} 
                            onValueChange={(val) => updateShipment.mutate({ id: currentShipment.id, data: { shipmentType: val as any } })}
                            className="flex flex-col space-y-1"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="with-inspection" id="r1" />
                                <Label htmlFor="r1" className="cursor-pointer font-normal">With Inspection</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no-inspection" id="r2" />
                                <Label htmlFor="r2" className="cursor-pointer font-normal">No Inspection</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label>Fumigation Provider</Label>
                        <Input 
                            placeholder="Fumigation Provider Name" 
                            value={manualFumigationName || ''} 
                            onChange={(e) => setManualFumigationName(e.target.value)}
                            className="h-8 text-sm"
                            data-testid="input-fumigation-name"
                        />
                        <RadioGroup 
                            value={currentShipment.manualFumigationMethod} 
                            onValueChange={(val) => updateShipment.mutate({ id: currentShipment.id, data: { manualFumigationMethod: val as any } })}
                            className="flex items-center gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="email" id="fum_m1" />
                                <Label htmlFor="fum_m1" className="text-xs cursor-pointer">Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="whatsapp" id="fum_m2" />
                                <Label htmlFor="fum_m2" className="text-xs cursor-pointer">WhatsApp</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label>Forwarder</Label>
                        <Input 
                            placeholder="Forwarder Name" 
                            value={manualForwarderName || ''} 
                            onChange={(e) => setManualForwarderName(e.target.value)}
                            className="h-8 text-sm"
                        />
                        <RadioGroup 
                            value={currentShipment.manualMethod} 
                            onValueChange={(val) => updateShipment.mutate({ id: currentShipment.id, data: { manualMethod: val as any } })}
                            className="flex items-center gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="email" id="m1" />
                                <Label htmlFor="m1" className="text-xs">Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="whatsapp" id="m2" />
                                <Label htmlFor="m2" className="text-xs">WhatsApp</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </div>

            {/* Main Content Column */}
            <div className="md:col-span-3 space-y-6">
                {/* Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-6 rounded-lg border border-l-4 border-l-primary shadow-sm">
                <h2 className="col-span-full text-lg font-bold text-primary mb-2">Shipment Details</h2>
                
                <div className="space-y-2">
                    <Label htmlFor="customer" className="text-xs text-muted-foreground uppercase font-bold">Customer</Label>
                    <Input id="customer" value={details.customer} onChange={(e) => handleDetailChange('customer', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="consignee" className="text-xs text-muted-foreground uppercase font-bold">Consignee</Label>
                    <Input id="consignee" value={details.consignee} onChange={(e) => handleDetailChange('consignee', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs text-muted-foreground uppercase font-bold">Location</Label>
                    <Input id="location" value={details.location} onChange={(e) => handleDetailChange('location', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="shippingLine" className="text-xs text-muted-foreground uppercase font-bold">Shipping Line</Label>
                    <Input id="shippingLine" value={details.shippingLine || ''} onChange={(e) => handleDetailChange('shippingLine', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="brand" className="text-xs text-muted-foreground uppercase font-bold">Brand</Label>
                    <Input id="brand" value={details.brand} onChange={(e) => handleDetailChange('brand', e.target.value)} />
                </div>

                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="inspectionDate" className="text-xs text-muted-foreground uppercase font-bold">Inspection Date</Label>
                        <Input type="date" id="inspectionDate" value={details.inspectionDate} onChange={(e) => handleDetailChange('inspectionDate', e.target.value)} />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="loadingDate" className="text-xs text-muted-foreground uppercase font-bold">Loading Date</Label>
                    <Input type="date" id="loadingDate" value={details.loadingDate} onChange={(e) => handleDetailChange('loadingDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="eta" className="text-xs text-muted-foreground uppercase font-bold">ETA</Label>
                    <Input type="date" id="eta" value={details.eta} onChange={(e) => handleDetailChange('eta', e.target.value)} />
                </div>
                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="idf" className="text-xs text-muted-foreground uppercase font-bold">IDF Number / PART</Label>
                        <Input id="idf" value={details.idf} onChange={(e) => handleDetailChange('idf', e.target.value)} className="font-mono uppercase" />
                    </div>
                )}
                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="seal" className="text-xs text-muted-foreground uppercase font-bold">Seal Number</Label>
                        <Input id="seal" value={details.seal} onChange={(e) => handleDetailChange('seal', e.target.value)} className="font-mono uppercase" />
                    </div>
                )}

                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="ucr" className="text-xs text-muted-foreground uppercase font-bold">UCR</Label>
                        <Input id="ucr" value={details.ucr} onChange={(e) => handleDetailChange('ucr', e.target.value)} className="font-mono uppercase" />
                    </div>
                )}
                {currentShipment.shipmentType === 'with-inspection' && (
                    <div className="space-y-2">
                        <Label htmlFor="proforma" className="text-xs text-muted-foreground uppercase font-bold">Proforma Inv.</Label>
                        <Input id="proforma" value={details.proforma} onChange={(e) => handleDetailChange('proforma', e.target.value)} className="font-mono uppercase" />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="container" className="text-xs text-muted-foreground uppercase font-bold">Container No.</Label>
                    <Input id="container" value={details.container} onChange={(e) => handleDetailChange('container', e.target.value)} className="font-mono uppercase" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="booking" className="text-xs text-muted-foreground uppercase font-bold">Booking No.</Label>
                    <Input id="booking" value={details.booking} onChange={(e) => handleDetailChange('booking', e.target.value)} className="font-mono uppercase" />
                </div>

                {/* Commercial Details - inline */}
                <div className="col-span-full pt-4 border-t">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Commercial Details</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Invoice #</Label>
                            <Input className="h-8 text-sm" value={commercial.invoice} onChange={(e) => handleCommercialChange('invoice', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Quantity</Label>
                            <Input className="h-8 text-sm" value={commercial.qty} onChange={(e) => handleCommercialChange('qty', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Net Weight</Label>
                            <Input className="h-8 text-sm" value={commercial.netWeight} onChange={(e) => handleCommercialChange('netWeight', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Gross Weight</Label>
                            <Input className="h-8 text-sm" value={commercial.grossWeight} onChange={(e) => handleCommercialChange('grossWeight', e.target.value)} />
                        </div>
                    </div>
                </div>
                </div>

                {/* Reconciliation */}
                <div className="space-y-4">

                    {/* Actual */}
                    <div className="bg-accent/5 p-5 rounded-lg border border-accent/20">
                        <h3 className="font-bold text-accent mb-3 text-sm uppercase tracking-wide">Actual Details (Loaded)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Invoice #</Label>
                            <Input className="h-8 bg-white" value={actual.invoice} onChange={(e) => handleActualChange('invoice', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Quantity</Label>
                            <Input className="h-8 bg-white" value={actual.qty} onChange={(e) => handleActualChange('qty', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Net Weight</Label>
                            <Input className="h-8 bg-white" value={actual.netWeight} onChange={(e) => handleActualChange('netWeight', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Gross Weight</Label>
                            <Input className="h-8 bg-white" value={actual.grossWeight} onChange={(e) => handleActualChange('grossWeight', e.target.value)} />
                        </div>
                        </div>
                        <div className="mt-4 flex items-center space-x-2 bg-success/10 p-3 rounded-md border border-success/20 w-fit">
                        <input 
                            type="checkbox" 
                            id="invoiceSent"
                            checked={actual.invoiceSent}
                            onChange={(e) => handleActualChange('invoiceSent', e.target.checked)}
                            className="h-4 w-4 text-success focus:ring-success border-gray-300 rounded cursor-pointer"
                        />
                        <Label htmlFor="invoiceSent" className="text-success font-bold cursor-pointer text-sm">Actual Invoice Sent to Client</Label>
                        </div>
                    </div>
                </div>

                {/* Phases */}
                <div className="space-y-6" id="phases-section">
                {currentShipment.shipmentType === 'with-inspection' && (
                    <>
                    <div id="phase-1">
                      <PhaseSection 
                          title="Phase 1: Pre-Inspection" 
                          phaseId="p1" 
                          tasks={phase1Mapped}
                          checklistState={currentShipment.checklist}
                          onToggle={(key) => toggleChecklist(currentShipment.id, key)}
                          progress={calculatePhaseProgress(currentShipment, phase1Mapped)}
                          missedTaskIds={incompleteTasks.map(t => t.id)}
                      />
                    </div>
                    <div id="phase-2">
                      <PhaseSection 
                          title={`Phase 2: Fumigation (${getFumigationDisplayName()})`}
                          phaseId="p2" 
                          tasks={fumigationMapped}
                          checklistState={currentShipment.checklist}
                          onToggle={(key) => toggleChecklist(currentShipment.id, key)}
                          progress={calculatePhaseProgress(currentShipment, fumigationMapped)}
                          missedTaskIds={incompleteTasks.map(t => t.id)}
                      />
                    </div>
                    <div id="phase-3">
                      <PhaseSection 
                          title="Phase 3: COC Finalization" 
                          phaseId="p3" 
                          tasks={phase3Mapped}
                          checklistState={currentShipment.checklist}
                          onToggle={(key) => toggleChecklist(currentShipment.id, key)}
                          progress={calculatePhaseProgress(currentShipment, phase3Mapped)}
                          missedTaskIds={incompleteTasks.map(t => t.id)}
                      />
                    </div>
                    </>
                )}
                
                <div id="phase-4">
                  <PhaseSection 
                      title={`Phase 4: Forwarding (${getForwarderDisplayName()})`}
                      phaseId="p4"
                      tasks={forwarderMapped}
                      checklistState={currentShipment.checklist}
                      onToggle={(key) => toggleChecklist(currentShipment.id, key)}
                      progress={calculatePhaseProgress(currentShipment, forwarderMapped)}
                      missedTaskIds={incompleteTasks.map(t => t.id)}
                      remarksData={remarksContext}
                  />
                </div>

                <div id="phase-5">
                  <PhaseSection 
                      title="Phase 5: Final Delivery"
                      phaseId="p5"
                      tasks={phase5Mapped}
                      checklistState={currentShipment.checklist}
                      onToggle={(key) => toggleChecklist(currentShipment.id, key)}
                      progress={calculatePhaseProgress(currentShipment, phase5Mapped)}
                      missedTaskIds={incompleteTasks.map(t => t.id)}
                  />
                </div>

                {/* Custom Tasks Section */}
                <div className="mb-6 border rounded-lg overflow-hidden bg-card shadow-sm">
                    <div className="bg-muted/30 px-4 py-3 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-primary">Additional / Custom Tasks</h3>
                    </div>
                    
                    <div className="p-4 space-y-3">
                        {currentShipment.customTasks.length > 0 ? (
                            currentShipment.customTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between group p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox 
                                            id={task.id} 
                                            checked={task.completed}
                                            onCheckedChange={() => toggleCustomTask(currentShipment.id, task.id)}
                                        />
                                        <Label 
                                            htmlFor={task.id}
                                            className={`text-sm font-medium leading-none cursor-pointer ${
                                                task.completed ? 'text-muted-foreground line-through decoration-muted-foreground/50' : ''
                                            }`}
                                        >
                                            {task.text}
                                        </Label>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => deleteCustomTask(currentShipment.id, task.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-muted-foreground text-sm italic">
                                No custom tasks added yet.
                            </div>
                        )}

                        <div className="pt-2 mt-2 border-t flex gap-2">
                            <Input 
                                placeholder="Add a new task..." 
                                value={newTaskInput}
                                onChange={(e) => setNewTaskInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTask()}
                            />
                            <Button size="icon" onClick={handleAddCustomTask}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                </div>
            </div>

            {/* Right Sidebar Column */}
            <div className="md:col-span-1 space-y-6">
                {/* Shipment Check List */}
                <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Todo List</h3>
                    
                    <div className="space-y-2">
                        {(currentShipment.shipmentChecklist || []).length > 0 ? (
                            (currentShipment.shipmentChecklist || []).map((item) => (
                                <div key={item.id} className="flex items-center justify-between group p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox 
                                            id={`shipment-${item.id}`}
                                            checked={item.completed}
                                            onCheckedChange={() => toggleShipmentChecklistItem(currentShipment.id, item.id)}
                                        />
                                        <Label 
                                            htmlFor={`shipment-${item.id}`}
                                            className={`text-sm leading-none cursor-pointer ${
                                                item.completed ? 'text-muted-foreground line-through decoration-muted-foreground/50' : ''
                                            }`}
                                        >
                                            {item.item}
                                        </Label>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        onClick={() => deleteShipmentChecklistItem(currentShipment.id, item.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-3 text-muted-foreground text-xs italic">
                                No checklist items yet.
                            </div>
                        )}

                        <div className="pt-2 border-t flex gap-2">
                            <Input 
                                placeholder="Add item..." 
                                value={newTaskInput}
                                onChange={(e) => setNewTaskInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newTaskInput.trim()) {
                                    addShipmentChecklistItem(currentShipment.id, newTaskInput.trim());
                                    setNewTaskInput('');
                                  }
                                }}
                                className="h-7 text-xs"
                            />
                            <Button 
                              size="icon"
                              onClick={() => {
                                if (newTaskInput.trim()) {
                                  addShipmentChecklistItem(currentShipment.id, newTaskInput.trim());
                                  setNewTaskInput('');
                                }
                              }}
                              className="flex-shrink-0"
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Shipment Documents */}
                <div className="bg-card p-4 rounded-lg border shadow-sm">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Shipment Documents</h3>
                    
                    <div className="space-y-2">
                        {(currentShipment.documents || []).length > 0 ? (
                            (currentShipment.documents || []).map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-md border text-xs group hover:bg-muted/30 transition-colors">
                                    <button
                                      onClick={() => {
                                        if (doc.file.startsWith('http')) {
                                          window.open(doc.file, '_blank');
                                          toast({
                                            title: "Opening Document",
                                            description: `${doc.name} is opening in Google Drive.`,
                                          });
                                        } else {
                                          const link = document.createElement('a');
                                          link.href = `data:application/pdf;base64,${doc.file}`;
                                          link.download = doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                          toast({
                                            title: "Download Started",
                                            description: `${doc.name} is being downloaded.`,
                                          });
                                        }
                                      }}
                                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer hover:opacity-70"
                                    >
                                        <Download className="h-3 w-3 text-accent flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">{doc.name}</div>
                                            <div className="text-muted-foreground text-xs">{format(new Date(doc.createdAt), 'MMM d, yyyy')}</div>
                                        </div>
                                    </button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-destructive flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                          deleteDocument(currentShipment.id, doc.id);
                                          toast({
                                            title: "Document Deleted",
                                            description: `${doc.name} has been removed.`,
                                          });
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-3 text-muted-foreground text-xs italic">
                                No documents yet.
                            </div>
                        )}

                        <div className="pt-2 border-t space-y-1">
                            <Input 
                                placeholder="Doc name (optional)" 
                                value={newDocName}
                                onChange={(e) => setNewDocName(e.target.value)}
                                className="h-7 text-xs"
                                disabled={uploadProgress !== null}
                            />
                            {uploadProgress !== null ? (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Uploading...</span>
                                        <span className="font-semibold">{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-1" />
                                </div>
                            ) : uploadError ? (
                                <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-md text-xs text-destructive">
                                    {uploadError}
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-1 p-2 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/30 transition-colors">
                                    <Plus className="h-3 w-3" />
                                    <span className="text-xs font-medium">Upload PDF</span>
                                    <input 
                                        type="file" 
                                        accept=".pdf" 
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Print Actions */}
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-2">
                     <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Print Templates</h3>
                     <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => handlePrint('declaration')}>
                        <Printer className="h-4 w-4" /> Declaration
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => handlePrint('undertaking')}>
                        <Printer className="h-4 w-4" /> Undertaking
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => handlePrint('shoes')}>
                        <Printer className="h-4 w-4" /> Shoes Undertaking
                    </Button>
                </div>

            </div>
        </div>

      </main>
    </div>
  );
}

export default function ShipmentDetail() {
  const [match, params] = useRoute('/shipment/:id');
  const { data: currentShipment, isLoading } = useShipment(params?.id || '');

  if (isLoading || !currentShipment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <ShipmentDetailContent currentShipment={currentShipment} />;
}
