import { ShipmentData } from "@/types/shipment";
import { PHASE_1_TASKS, PHASE_2_TASKS, PHASE_3_TASKS, getForwarderTasks, getFumigationTasks, TaskDefinition } from "./shipment-definitions";

export function calculateProgress(data: ShipmentData): number {
  let allTasks: string[] = [];

  // Add tasks based on shipment type logic
  if (data.shipmentType === 'with-inspection') {
    allTasks = [
      ...allTasks,
      ...PHASE_1_TASKS.map(t => t.id),
      ...PHASE_2_TASKS.map(t => t.id),
      ...PHASE_3_TASKS.map(t => t.id)
    ];
  }

  // Always add Phase 4 (Forwarder) tasks
  const forwarderTasks = getForwarderTasks(data);
  allTasks = [...allTasks, ...forwarderTasks.map(t => t.id)];

  // Calculate standard tasks completion
  const standardCompleted = allTasks.filter(taskId => data.checklist[taskId]).length;

  // Calculate custom tasks completion
  const customTotal = data.customTasks?.length || 0;
  const customCompleted = data.customTasks?.filter(t => t.completed).length || 0;

  const totalTasks = allTasks.length + customTotal;

  if (totalTasks === 0) return 0;

  const totalCompleted = standardCompleted + customCompleted;
  
  return Math.round((totalCompleted / totalTasks) * 100);
}

export function calculatePhaseProgress(data: ShipmentData, tasks: TaskDefinition[]): number {
  if (!tasks || tasks.length === 0) return 0;
  
  const completedCount = tasks.filter(task => data.checklist[task.id]).length;
  return Math.round((completedCount / tasks.length) * 100);
}

export function getIncompleteTasks(data: ShipmentData): TaskDefinition[] {
  let allTasks: TaskDefinition[] = [];

  if (data.shipmentType === 'with-inspection') {
    allTasks = [
      ...allTasks,
      ...PHASE_1_TASKS,
    ];
  }

  // Use fumigation tasks instead of PHASE_2_TASKS
  const fumigationTasks = getFumigationTasks(data);
  allTasks = [...allTasks, ...fumigationTasks];

  if (data.shipmentType === 'with-inspection') {
    allTasks = [...allTasks, ...PHASE_3_TASKS];
  }

  const forwarderTasks = getForwarderTasks(data);
  allTasks = [...allTasks, ...forwarderTasks];

  // Find skipped tasks: incomplete tasks that have at least one completed task after them
  const missedTasks: TaskDefinition[] = [];

  for (let i = 0; i < allTasks.length; i++) {
    const task = allTasks[i];
    // If this task is incomplete
    if (!data.checklist[task.id]) {
      // Check if there's any completed task after it
      const hasCompletedAfter = allTasks.slice(i + 1).some(t => data.checklist[t.id]);
      if (hasCompletedAfter) {
        missedTasks.push(task);
      }
    }
  }

  return missedTasks;
}
