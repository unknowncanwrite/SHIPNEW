export interface ShipmentData {
  id: string; // Document ID (e.g., "INV-500")
  createdAt: number; // Timestamp
  lastUpdated: number; // Timestamp

  // --- Logic Toggles ---
  shipmentType: 'with-inspection' | 'no-inspection' | string;
  forwarder: 'xpo' | 'hmi' | 'manual' | string;
  manualForwarderName: string | null;
  manualMethod: 'email' | 'whatsapp' | string | null;
  fumigation: 'sky-services' | 'sgs' | 'manual' | string;
  manualFumigationName: string | null;
  manualFumigationMethod: 'email' | 'whatsapp' | string | null;

  // --- Input Fields (Mapped from HTML) ---
  details: {
    customer: string;      // #inp-customer
    consignee: string;     // #inp-consignee
    location: string;      // #inp-location
    brand: string;         // #inp-brand
    inspectionDate: string;// #inp-date (YYYY-MM-DD)
    eta: string;           // #inp-eta (YYYY-MM-DD)
    loadingDate: string;   // #inp-loading-date (YYYY-MM-DD)
    idf: string;           // #inp-idf
    seal: string;          // #inp-seal
    ucr: string;           // #inp-ucr
    proforma: string;      // #inp-proforma
    commercialInv: string; // #inp-invoice
    container: string;     // #inp-container
    booking: string;       // #inp-booking
  };

  // --- Reconciliation Section ---
  commercial: {
    invoice: string; qty: string; netWeight: string; grossWeight: string;
  };
  actual: {
    invoice: string; qty: string; netWeight: string; grossWeight: string;
    invoiceSent: boolean; // #actual-invoice-status
  };

  // --- Custom Tasks ---
  customTasks: Array<{ id: string; text: string; completed: boolean }>;

  // --- Documents ---
  documents: Array<{ id: string; name: string; file: string; createdAt: number }>;

  // --- Checklist State (Boolean Map) ---
  // Must support ALL phases logic
  checklist: Record<string, boolean>;

  // --- Shipment Check List ---
  shipmentChecklist: Array<{ id: string; item: string; completed: boolean }>;
}

export const initialShipmentData: ShipmentData = {
  id: '',
  createdAt: Date.now(),
  lastUpdated: Date.now(),
  shipmentType: 'with-inspection',
  forwarder: '',
  manualForwarderName: null,
  manualMethod: 'email',
  fumigation: 'sky-services',
  manualFumigationName: null,
  manualFumigationMethod: 'email',
  details: {
    customer: '',
    consignee: '',
    location: '',
    brand: '',
    inspectionDate: '',
    eta: '',
    loadingDate: '',
    idf: '',
    seal: '',
    ucr: '',
    proforma: '',
    commercialInv: '',
    container: '',
    booking: '',
  },
  commercial: {
    invoice: '',
    qty: '',
    netWeight: '',
    grossWeight: '',
  },
  actual: {
    invoice: '',
    qty: '',
    netWeight: '',
    grossWeight: '',
    invoiceSent: false,
  },
  customTasks: [],
  documents: [],
  checklist: {},
  shipmentChecklist: [],
};
