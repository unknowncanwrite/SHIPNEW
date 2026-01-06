import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, bigint, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Shipments table
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey(), // e.g., "INV-500"
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  lastUpdated: bigint("last_updated", { mode: "number" }).notNull(),
  
  // Logic toggles
  shipmentType: varchar("shipment_type", { length: 20 }).notNull().default("with-inspection"),
  forwarder: varchar("forwarder", { length: 20 }).notNull().default(""),
  manualForwarderName: text("manual_forwarder_name").default(""),
  manualMethod: varchar("manual_method", { length: 20 }).default("email"),
  fumigation: varchar("fumigation", { length: 20 }).notNull().default("sky-services"),
  manualFumigationName: text("manual_fumigation_name").default(""),
  manualFumigationMethod: varchar("manual_fumigation_method", { length: 20 }).default("email"),
  
  // Stored as JSON for complex nested data
  details: jsonb("details").notNull().$type<{
    customer: string;
    consignee: string;
    location: string;
    shippingLine: string;
    brand: string;
    inspectionDate: string;
    eta: string;
    loadingDate: string;
    idf: string;
    seal: string;
    ucr: string;
    proforma: string;
    commercialInv: string;
    container: string;
    booking: string;
  }>(),
  
  commercial: jsonb("commercial").notNull().$type<{
    invoice: string;
    qty: string;
    netWeight: string;
    grossWeight: string;
  }>(),
  
  actual: jsonb("actual").notNull().$type<{
    invoice: string;
    qty: string;
    netWeight: string;
    grossWeight: string;
    invoiceSent: boolean;
  }>(),
  
  customTasks: jsonb("custom_tasks").notNull().$type<Array<{ id: string; text: string; completed: boolean }>>(),
  documents: jsonb("documents").notNull().$type<Array<{ id: string; name: string; file: string; createdAt: number }>>(),
  checklist: jsonb("checklist").notNull().$type<Record<string, boolean | string>>(),
  shipmentChecklist: jsonb("shipment_checklist").notNull().$type<Array<{ id: string; item: string; completed: boolean }>>(),
});

// Notes table
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  notes: text("notes").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  details: text("details").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// Audit Log table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull(),
  action: varchar("action").notNull(), // 'create', 'update', 'delete'
  fieldName: text("field_name"), // e.g., 'details.customer', 'customTasks', etc.
  oldValue: text("old_value"), // JSON stringified previous value
  newValue: text("new_value"), // JSON stringified new value
  summary: text("summary").notNull(), // Human-readable summary
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
});

// Insert schemas - make all fields optional except required ones
export const insertShipmentSchema = createInsertSchema(shipments, {
  createdAt: z.number().optional(),
  lastUpdated: z.number().optional(),
  details: z.any(),
  commercial: z.any(),
  actual: z.any(),
  customTasks: z.any().optional().default([]),
  documents: z.any().optional().default([]),
  checklist: z.any().optional().default({}),
  shipmentChecklist: z.any().optional().default([]),
}).partial().required({
  id: true,
});

export const insertNoteSchema = createInsertSchema(notes, {
  id: z.string().optional(),
  createdAt: z.number().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertContactSchema = createInsertSchema(contacts, {
  id: z.string().optional(),
  createdAt: z.number().optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Audit log schemas
export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  id: z.string().optional(),
  timestamp: z.number().optional(),
}).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
