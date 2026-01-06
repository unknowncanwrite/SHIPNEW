import { connectMongoDB, ShipmentModel, NoteModel, ContactModel, AuditLogModel } from './mongodb';
import type { Shipment, InsertShipment, Note, InsertNote, Contact, InsertContact, AuditLog, InsertAuditLog } from '@shared/schema';

export interface IStorage {
  getAllShipments(): Promise<Shipment[]>;
  getShipment(id: string): Promise<Shipment | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment | undefined>;
  deleteShipment(id: string): Promise<boolean>;
  
  getAuditLogs(shipmentId: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  getAllNotes(): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  getAllContacts(): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;
}

function docToShipment(doc: any): Shipment {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id,
    createdAt: obj.createdAt,
    lastUpdated: obj.lastUpdated,
    shipmentType: obj.shipmentType || 'with-inspection',
    forwarder: obj.forwarder || '',
    manualForwarderName: obj.manualForwarderName || '',
    manualMethod: obj.manualMethod || 'email',
    fumigation: obj.fumigation || 'sky-services',
    manualFumigationName: obj.manualFumigationName || '',
    manualFumigationMethod: obj.manualFumigationMethod || 'email',
    details: obj.details || {},
    commercial: obj.commercial || {},
    actual: obj.actual || {},
    customTasks: obj.customTasks || [],
    documents: obj.documents || [],
    checklist: obj.checklist instanceof Map ? Object.fromEntries(obj.checklist) : (obj.checklist || {}),
    shipmentChecklist: obj.shipmentChecklist || [],
  };
}

function docToNote(doc: any): Note {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    name: obj.name,
    notes: obj.notes,
    createdAt: obj.createdAt,
  };
}

function docToContact(doc: any): Contact {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    name: obj.name,
    details: obj.details,
    createdAt: obj.createdAt,
  };
}

function docToAuditLog(doc: any): AuditLog {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    shipmentId: obj.shipmentId,
    action: obj.action,
    fieldName: obj.fieldName || null,
    oldValue: obj.oldValue || null,
    newValue: obj.newValue || null,
    summary: obj.summary,
    timestamp: obj.timestamp,
  };
}

export class MongoStorage implements IStorage {
  private initialized = false;

  private async init() {
    if (!this.initialized) {
      await connectMongoDB();
      this.initialized = true;
    }
  }

  async getAllShipments(): Promise<Shipment[]> {
    await this.init();
    const docs = await ShipmentModel.find().sort({ createdAt: -1 });
    return docs.map(docToShipment);
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    await this.init();
    const doc = await ShipmentModel.findById(id);
    return doc ? docToShipment(doc) : undefined;
  }

  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    await this.init();
    const now = Date.now();
    const doc = await ShipmentModel.create({
      _id: shipment.id,
      ...shipment,
      createdAt: shipment.createdAt ?? now,
      lastUpdated: shipment.lastUpdated ?? now,
    });
    return docToShipment(doc);
  }

  async updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment | undefined> {
    await this.init();
    const doc = await ShipmentModel.findByIdAndUpdate(
      id,
      { $set: { ...shipment, lastUpdated: Date.now() } },
      { new: true, runValidators: true }
    );
    return doc ? docToShipment(doc) : undefined;
  }

  async deleteShipment(id: string): Promise<boolean> {
    await this.init();
    const result = await ShipmentModel.findByIdAndDelete(id);
    return !!result;
  }

  async getAuditLogs(shipmentId: string): Promise<AuditLog[]> {
    await this.init();
    const docs = await AuditLogModel.find({ shipmentId }).sort({ timestamp: -1 });
    return docs.map(docToAuditLog);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    await this.init();
    const now = Date.now();
    const doc = await AuditLogModel.create({
      ...log,
      timestamp: (log as any).timestamp ?? now,
    });
    return docToAuditLog(doc);
  }

  async getAllNotes(): Promise<Note[]> {
    await this.init();
    const docs = await NoteModel.find().sort({ createdAt: -1 });
    return docs.map(docToNote);
  }

  async createNote(note: InsertNote): Promise<Note> {
    await this.init();
    const doc = await NoteModel.create({
      ...note,
      createdAt: Date.now(),
    });
    return docToNote(doc);
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    await this.init();
    const doc = await NoteModel.findByIdAndUpdate(id, note, { new: true });
    return doc ? docToNote(doc) : undefined;
  }

  async deleteNote(id: string): Promise<boolean> {
    await this.init();
    const result = await NoteModel.findByIdAndDelete(id);
    return !!result;
  }

  async getAllContacts(): Promise<Contact[]> {
    await this.init();
    const docs = await ContactModel.find().sort({ createdAt: -1 });
    return docs.map(docToContact);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    await this.init();
    const doc = await ContactModel.create({
      ...contact,
      createdAt: Date.now(),
    });
    return docToContact(doc);
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    await this.init();
    const doc = await ContactModel.findByIdAndUpdate(id, contact, { new: true });
    return doc ? docToContact(doc) : undefined;
  }

  async deleteContact(id: string): Promise<boolean> {
    await this.init();
    const result = await ContactModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const storage = new MongoStorage();
