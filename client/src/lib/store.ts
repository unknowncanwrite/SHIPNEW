import { create } from 'zustand';
import { ShipmentData, initialShipmentData } from '@/types/shipment';
import { persist } from 'zustand/middleware';

interface ShipmentStore {
  shipments: ShipmentData[];
  currentShipment: ShipmentData | null;
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  createShipment: (id: string) => void;
  loadShipment: (id: string) => void;
  updateShipment: (id: string, data: Partial<ShipmentData>) => void;
  deleteShipment: (id: string) => void;
  toggleChecklist: (id: string, key: string) => void;
  addCustomTask: (id: string, task: string) => void;
  toggleCustomTask: (id: string, taskId: string) => void;
  deleteCustomTask: (id: string, taskId: string) => void;
  addDocument: (id: string, name: string, file: string) => void;
  deleteDocument: (id: string, documentId: string) => void;
}

// Mock initial data
const MOCK_SHIPMENTS: ShipmentData[] = [
  {
    ...initialShipmentData,
    id: 'INV-501',
    createdAt: Date.now() - 86400000 * 2,
    lastUpdated: Date.now() - 3600000,
    details: {
      ...initialShipmentData.details,
      customer: 'Global Logistics Ltd',
      container: 'MSCU1234567',
      eta: '2025-06-15',
      inspectionDate: '2025-05-20',
    },
    documents: [],
    checklist: {
      'p1_docs': true,
      'p1_mail': true,
    }
  },
  {
    ...initialShipmentData,
    id: 'INV-502',
    createdAt: Date.now() - 86400000 * 5,
    lastUpdated: Date.now() - 7200000,
    details: {
      ...initialShipmentData.details,
      customer: 'Oceanic Trade Co',
      container: 'CMAU9876543',
      eta: '2025-06-20',
      inspectionDate: '2025-05-25',
    },
    documents: [],
     checklist: {
      'p1_docs': true,
    }
  }
];

export const useShipmentStore = create<ShipmentStore>()(
  persist(
    (set, get) => ({
      shipments: MOCK_SHIPMENTS,
      currentShipment: null,
      isLoading: false,
      isSaving: false,

      createShipment: (id) => {
        const newShipment: ShipmentData = {
          ...initialShipmentData,
          id,
          createdAt: Date.now(),
          lastUpdated: Date.now(),
        };
        set((state) => ({
          shipments: [newShipment, ...state.shipments],
          currentShipment: newShipment,
        }));
      },

      loadShipment: (id) => {
        let shipment = get().shipments.find((s) => s.id === id);
        if (shipment && !shipment.documents) {
          shipment = { ...shipment, documents: [] };
        }
        set({ currentShipment: shipment || null });
      },

      updateShipment: (id, data) => {
        set({ isSaving: true });
        
        // Simulate network delay for "Saving..." indicator
        setTimeout(() => {
          set((state) => {
            const updatedShipments = state.shipments.map((s) => {
              if (s.id === id) {
                const updated = { ...s, ...data, lastUpdated: Date.now() };
                // Ensure documents always exists
                if (!updated.documents) {
                  updated.documents = [];
                }
                return updated;
              }
              return s;
            });
            
            // Update current shipment if it's the one being edited
            let updatedCurrent = state.currentShipment?.id === id 
              ? { ...state.currentShipment, ...data, lastUpdated: Date.now() } 
              : state.currentShipment;
            
            // Ensure documents always exists in current shipment
            if (updatedCurrent && !updatedCurrent.documents) {
              updatedCurrent = { ...updatedCurrent, documents: [] };
            }

            return {
              shipments: updatedShipments,
              currentShipment: updatedCurrent,
              isSaving: false,
            };
          });
        }, 1000);
      },

      deleteShipment: (id) => {
        set((state) => ({
          shipments: state.shipments.filter((s) => s.id !== id),
          currentShipment: state.currentShipment?.id === id ? null : state.currentShipment,
        }));
      },

      toggleChecklist: (id, key) => {
        let shipment = get().shipments.find((s) => s.id === id);
        if (!shipment) return;
        
        // Ensure documents exists
        if (!shipment.documents) {
          shipment = { ...shipment, documents: [] };
        }

        const newChecklist = { ...shipment.checklist, [key]: !shipment.checklist[key] };
        get().updateShipment(id, { checklist: newChecklist });
      },

      addCustomTask: (id, taskText) => {
        const shipment = get().shipments.find((s) => s.id === id);
        if (!shipment) return;

        const newTask = {
          id: Math.random().toString(36).substr(2, 9),
          text: taskText,
          completed: false,
        };

        const newCustomTasks = [...shipment.customTasks, newTask];
        get().updateShipment(id, { customTasks: newCustomTasks });
      },

      toggleCustomTask: (id, taskId) => {
        const shipment = get().shipments.find((s) => s.id === id);
        if (!shipment) return;

        const newCustomTasks = shipment.customTasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        get().updateShipment(id, { customTasks: newCustomTasks });
      },

      deleteCustomTask: (id, taskId) => {
        const shipment = get().shipments.find((s) => s.id === id);
        if (!shipment) return;

        const newCustomTasks = shipment.customTasks.filter(t => t.id !== taskId);
        get().updateShipment(id, { customTasks: newCustomTasks });
      },

      addDocument: (id, name, file) => {
        const shipment = get().shipments.find((s) => s.id === id);
        if (!shipment) return;

        const newDocument = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          file,
          createdAt: Date.now(),
        };

        const newDocuments = [...shipment.documents, newDocument];
        get().updateShipment(id, { documents: newDocuments });
      },

      deleteDocument: (id, documentId) => {
        const shipment = get().shipments.find((s) => s.id === id);
        if (!shipment) return;

        const newDocuments = shipment.documents.filter(d => d.id !== documentId);
        get().updateShipment(id, { documents: newDocuments });
      },
    }),
    {
      name: 'shipment-storage',
    }
  )
);
