import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'shipview',
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

const shipmentSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  createdAt: { type: Number, required: true },
  lastUpdated: { type: Number, required: true },
  shipmentType: { type: String, default: 'with-inspection' },
  forwarder: { type: String, default: '' },
  manualForwarderName: { type: String, default: '' },
  manualMethod: { type: String, default: 'email' },
  fumigation: { type: String, default: 'sky-services' },
  manualFumigationName: { type: String, default: '' },
  manualFumigationMethod: { type: String, default: 'email' },
  details: {
    customer: String,
    consignee: String,
    location: String,
    shippingLine: String,
    brand: String,
    inspectionDate: String,
    eta: String,
    loadingDate: String,
    idf: String,
    seal: String,
    ucr: String,
    proforma: String,
    commercialInv: String,
    container: String,
    booking: String,
  },
  commercial: {
    invoice: String,
    qty: String,
    netWeight: String,
    grossWeight: String,
  },
  actual: {
    invoice: String,
    qty: String,
    netWeight: String,
    grossWeight: String,
    invoiceSent: Boolean,
  },
  customTasks: [{ id: String, text: String, completed: Boolean }],
  documents: [{ id: String, name: String, file: String, createdAt: Number }],
  checklist: { type: Map, of: mongoose.Schema.Types.Mixed },
  shipmentChecklist: [{ id: String, item: String, completed: Boolean }],
});

const noteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  notes: { type: String, required: true },
  createdAt: { type: Number, required: true },
});

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  details: { type: String, required: true },
  createdAt: { type: Number, required: true },
});

const auditLogSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true },
  action: { type: String, required: true },
  fieldName: String,
  oldValue: String,
  newValue: String,
  summary: { type: String, required: true },
  timestamp: { type: Number, required: true },
});

export const ShipmentModel = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
export const NoteModel = mongoose.models.Note || mongoose.model('Note', noteSchema);
export const ContactModel = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
