import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc } from 'drizzle-orm';
import { shipments, notes, contacts, auditLogs, type Shipment, type InsertShipment, type Note, type InsertNote, type Contact, type InsertContact, type AuditLog, type InsertAuditLog } from '@shared/schema';

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  throw new Error('SUPABASE_DATABASE_URL environment variable is required');
}

const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require'
});
const db = drizzle(client);

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

export class SupabaseStorage implements IStorage {
  async getAllShipments(): Promise<Shipment[]> {
    const result = await db.select().from(shipments).orderBy(desc(shipments.createdAt));
    return result;
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    const result = await db.select().from(shipments).where(eq(shipments.id, id)).limit(1);
    return result[0];
  }

  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const now = Date.now();
    const newShipment = {
      id: shipment.id,
      createdAt: shipment.createdAt ?? now,
      lastUpdated: shipment.lastUpdated ?? now,
      shipmentType: shipment.shipmentType || 'with-inspection',
      forwarder: shipment.forwarder || '',
      manualForwarderName: shipment.manualForwarderName || '',
      manualMethod: shipment.manualMethod || 'email',
      fumigation: shipment.fumigation || 'sky-services',
      manualFumigationName: shipment.manualFumigationName || '',
      manualFumigationMethod: shipment.manualFumigationMethod || 'email',
      details: shipment.details || {},
      commercial: shipment.commercial || {},
      actual: shipment.actual || {},
      customTasks: shipment.customTasks || [],
      documents: shipment.documents || [],
      checklist: shipment.checklist || {},
      shipmentChecklist: shipment.shipmentChecklist || [],
    };
    
    const result = await db.insert(shipments).values(newShipment as any).returning();
    return result[0];
  }

  async updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const updateData = { ...shipment, lastUpdated: Date.now() };
    const result = await db.update(shipments).set(updateData as any).where(eq(shipments.id, id)).returning();
    return result[0];
  }

  async deleteShipment(id: string): Promise<boolean> {
    const result = await db.delete(shipments).where(eq(shipments.id, id)).returning();
    return result.length > 0;
  }

  async getAuditLogs(shipmentId: string): Promise<AuditLog[]> {
    const result = await db.select().from(auditLogs).where(eq(auditLogs.shipmentId, shipmentId)).orderBy(desc(auditLogs.timestamp));
    return result;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const now = Date.now();
    const newLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: now,
    };
    const result = await db.insert(auditLogs).values(newLog).returning();
    return result[0];
  }

  async getAllNotes(): Promise<Note[]> {
    const result = await db.select().from(notes).orderBy(desc(notes.createdAt));
    return result;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const now = Date.now();
    const newNote = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: now,
    };
    const result = await db.insert(notes).values(newNote).returning();
    return result[0];
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const result = await db.update(notes).set(note).where(eq(notes.id, id)).returning();
    return result[0];
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id)).returning();
    return result.length > 0;
  }

  async getAllContacts(): Promise<Contact[]> {
    const result = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
    return result;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const now = Date.now();
    const newContact = {
      ...contact,
      id: crypto.randomUUID(),
      createdAt: now,
    };
    const result = await db.insert(contacts).values(newContact).returning();
    return result[0];
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const result = await db.update(contacts).set(contact).where(eq(contacts.id, id)).returning();
    return result[0];
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new SupabaseStorage();
