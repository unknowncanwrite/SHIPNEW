import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Task {
  id: string;
  label: string;
  hasEmail?: boolean;
  emailSubject?: string;
  emailBody?: string;
  emailTo?: string;
  emailCC?: string;
  isWhatsApp?: boolean;
  whatsappBody?: string;
  needsAttachmentCheck?: boolean;
  note?: string;
  subTasks?: string[];
  hideSubject?: boolean;
  hasRemarks?: boolean;
  onToggle?: (checked: boolean) => void;
  onSubTaskToggle?: (taskId: string, subTaskIdx: number, checked: boolean) => void;
}

interface PhaseSectionProps {
  title: string;
  phaseId: string;
  tasks: Task[];
  checklistState: Record<string, boolean | string>;
  onToggle: (key: string, value?: boolean | string) => void;
  progress: number;
  missedTaskIds?: string[];
  remarksData?: {
    list: any[];
    input: string;
    setInput: (val: string) => void;
    onAdd: (text: string) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
  };
}

export default function PhaseSection({ 
  title, 
  phaseId, 
  tasks, 
  checklistState, 
  onToggle,
  progress,
  missedTaskIds = [],
  remarksData
}: PhaseSectionProps) {
  const { toast } = useToast();
  const [subTaskState, setSubTaskState] = useState<Record<string, boolean>>({});
  const [localRemarks, setLocalRemarks] = useState<Record<string, string>>({});

  // Initialize local remarks from checklistState
  useEffect(() => {
    const remarks: Record<string, string> = {};
    Object.keys(checklistState).forEach(key => {
      if (key.endsWith('_remarks') && typeof checklistState[key] === 'string') {
        remarks[key] = checklistState[key] as string;
      }
    });
    setLocalRemarks(remarks);
  }, [checklistState]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`,
    });
  };

  return (
    <div className="mb-6 border rounded-lg overflow-hidden bg-card shadow-sm">
      <div className="bg-muted/30 px-4 py-3 border-b flex justify-between items-center">
        <h3 className="font-semibold text-lg text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-muted-foreground">{Math.round(progress)}%</div>
          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {tasks.map((task) => {
          const isMissed = missedTaskIds.includes(task.id);
          const isHighlighted = task.id === 'p3_prepare_docs';
          const isChecked = !!checklistState[task.id];
          const remarksKey = `${task.id}_remarks`;
          const remarkValue = localRemarks[remarksKey] || '';
          
          const handleRemarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setLocalRemarks(prev => ({ ...prev, [remarksKey]: newValue }));
          };

          const handleRemarkBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const val = e.target.value.trim();
            // Only update if it actually changed to avoid unnecessary re-renders/saves
            if (val !== (checklistState[remarksKey] || '')) {
              onToggle(remarksKey, val);
            }
          };
          
          return (
          <div key={task.id} className={`space-y-2 ${isMissed ? 'border-l-2 border-l-warning bg-warning/5 pl-3 py-2 rounded' : ''}`}>
            <div className={`flex items-start justify-between group p-2 rounded-md hover:bg-muted/50 transition-colors ${isMissed ? 'border-l-4 border-l-warning/50 pl-1' : ''}`}>
              <div className="flex items-start space-x-3 pt-1 w-full">
                <Checkbox 
                  id={task.id} 
                  checked={isChecked}
                  onCheckedChange={(checked) => task.onToggle ? task.onToggle(!!checked) : onToggle(task.id, !!checked)}
                  className="mt-1"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <Label 
                      htmlFor={task.id}
                      className={`text-sm font-medium leading-none cursor-pointer ${
                        isChecked ? 'text-muted-foreground line-through decoration-muted-foreground/50' : isMissed ? 'text-warning font-semibold' : ''
                      }`}
                    >
                      {task.label}
                    </Label>
                  </div>

                  {task.id === 'p4_final_bl' && remarksData && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Subtasks on the left */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Checklist</div>
                        {task.subTasks && task.subTasks.map((subTask, idx) => {
                          const subTaskKey = `${task.id}_subtask_${idx}`;
                          const subIsChecked = !!checklistState[subTaskKey];
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <Checkbox 
                                id={subTaskKey}
                                checked={subIsChecked}
                                onCheckedChange={(checked) => task.onSubTaskToggle?.(task.id, idx, !!checked)}
                                className="h-3.5 w-3.5"
                              />
                              <Label 
                                htmlFor={subTaskKey}
                                className={`text-xs font-medium cursor-pointer ${subIsChecked ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}
                              >
                                {subTask}
                              </Label>
                            </div>
                          );
                        })}
                      </div>

                      {/* Remarks on the right */}
                      <div className="p-3 bg-card border rounded-md shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remarks</span>
                          <Badge variant="outline" className="text-[10px] h-4">{remarksData.list.length}</Badge>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {remarksData.list.map((item: any) => (
                            <div key={item.id} className="flex items-start gap-2 group">
                              <Checkbox 
                                id={`remark-${item.id}`} 
                                checked={item.completed} 
                                onCheckedChange={() => remarksData.onToggle(item.id)}
                                className="mt-0.5 h-3.5 w-3.5"
                              />
                              <Label 
                                htmlFor={`remark-${item.id}`} 
                                className={`text-xs flex-1 break-words cursor-pointer ${item.completed ? 'text-muted-foreground line-through' : ''}`}
                              >
                                {item.item}
                              </Label>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-4 w-4 opacity-0 group-hover:opacity-100 text-destructive p-0"
                                onClick={() => remarksData.onDelete(item.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="New remark..." 
                            value={remarksData.input}
                            onChange={(e) => remarksData.setInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                remarksData.onAdd(remarksData.input);
                              }
                            }}
                            className="h-7 text-xs"
                          />
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-7 w-7"
                            onClick={() => remarksData.onAdd(remarksData.input)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {task.id !== 'p4_final_bl' && task.subTasks && task.subTasks.length > 0 && (
                    <div className="text-sm mt-1 bg-accent/20 text-foreground p-2 rounded border border-accent/30">
                      Health Cert, Fumigation Cert, CI, PL, Declaration of Origin, Used Clothing & Shoes Undertakings
                    </div>
                  )}
                  {task.id === 'p3a_sgs_docs' && (
                    <div className="text-xs mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`${task.id}-attachment-confirm`}
                          checked={!!checklistState[`${task.id}_subtask_confirm`]}
                          onCheckedChange={(checked) => task.onSubTaskToggle?.(task.id, 999, !!checked)} // Using 999 for special confirm
                          className="h-4 w-4"
                        />
                        <Label 
                          htmlFor={`${task.id}-attachment-confirm`}
                          className="text-xs font-medium cursor-pointer text-muted-foreground"
                        >
                          CONFIRM ATTACHEMENT: Health Cert, Fumigation Cert, CI, PL, Declaration of Origin, Used Clothing & Shoes Undertakings
                        </Label>
                      </div>
                    </div>
                  )}
                  {task.id !== 'p4_final_bl' && task.subTasks && task.subTasks.length > 0 && (
                    <div className="text-xs mt-2 ml-0 space-y-1">
                      {task.subTasks.map((subTask, idx) => {
                        const subTaskKey = `${task.id}_subtask_${idx}`;
                        const subIsChecked = !!checklistState[subTaskKey];
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <Checkbox 
                              id={subTaskKey}
                              checked={subIsChecked}
                              onCheckedChange={(checked) => task.onSubTaskToggle?.(task.id, idx, !!checked)}
                              className="h-4 w-4"
                            />
                            <Label 
                              htmlFor={subTaskKey}
                              className={`text-xs font-medium cursor-pointer ${subIsChecked ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}
                            >
                              {subTask}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isMissed && <div className="text-xs text-warning font-medium">⚠ Skipped</div>}
                </div>
              </div>
            </div>

            {task.hasEmail && (
              <div className="ml-7 space-y-2 p-3 bg-muted/30 rounded-md border border-muted text-xs">
                {task.emailTo && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-muted-foreground uppercase">To:</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                        onClick={() => copyToClipboard(task.emailTo || '', 'To')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-foreground">{task.emailTo}</div>
                  </div>
                )}
                {task.emailCC && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-muted-foreground uppercase">CC:</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                        onClick={() => copyToClipboard(task.emailCC || '', 'CC')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-foreground">{task.emailCC}</div>
                  </div>
                )}
                {!task.hideSubject && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-muted-foreground uppercase">Subject:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                      onClick={() => copyToClipboard(task.emailSubject || '', 'Subject')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-foreground">{task.emailSubject}</div>
                </div>
                )}
                {task.note && (
                  <div className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded border border-muted/50">
                    {task.note}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-muted-foreground uppercase">Body:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                      onClick={() => copyToClipboard(task.emailBody || '', 'Body')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-foreground whitespace-pre-wrap">{task.emailBody}</div>
                </div>
              </div>
            )}

            {task.isWhatsApp && task.whatsappBody && (
              <div className="ml-7 space-y-2 p-3 bg-muted/30 rounded-md border border-muted text-xs">
                {task.note && (
                  <div className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded border border-muted/50">
                    {task.note}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-muted-foreground uppercase">Message:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-accent hover:text-accent hover:bg-accent/10"
                      onClick={() => copyToClipboard(task.whatsappBody || '', 'Message')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-foreground whitespace-pre-wrap">{task.whatsappBody}</div>
                </div>
              </div>
            )}
          </div>
        );
        })}
      </div>
    </div>
  );
}
