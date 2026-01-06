import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-supabase";
import { insertShipmentSchema, insertNoteSchema, insertContactSchema, type Shipment } from "@shared/schema";
import { z } from "zod";
import { uploadFileToDrive, deleteFileFromDrive } from "./google-drive";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Add CORS headers middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // ============ SHIPMENT ROUTES ============
  
  // Get all shipments
  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getAllShipments();
      res.json(shipments);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });
  
  // Get single shipment
  app.get("/api/shipments/:id", async (req, res) => {
    try {
      const shipment = await storage.getShipment(req.params.id);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      console.error("Error fetching shipment:", error);
      res.status(500).json({ error: "Failed to fetch shipment" });
    }
  });
  
  // Create shipment
  app.post("/api/shipments", async (req, res) => {
    try {
      const data = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(data);
      res.status(201).json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      }
      console.error("Error creating shipment:", error);
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });
  
  // Update shipment
  app.patch("/api/shipments/:id", async (req, res) => {
    try {
      const oldShipment = await storage.getShipment(req.params.id);
      
      let updateData = req.body;
      if (updateData.documents && Array.isArray(updateData.documents)) {
        updateData.documents = updateData.documents.map((doc: any) => ({
          id: doc.id || Math.random().toString(36).substr(2, 9),
          name: doc.name || 'Untitled Document',
          file: doc.file,
          createdAt: doc.createdAt || Date.now(),
        }));
      }
      const shipment = await storage.updateShipment(req.params.id, updateData);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }

      // Log changes to audit trail
      if (oldShipment) {
        Object.entries(updateData).forEach(([key, newVal]) => {
          const oldVal = (oldShipment as any)[key];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            const summaryMap: Record<string, string> = {
              'customTasks': 'Modified custom tasks',
              'shipmentChecklist': 'Modified todo list',
              'checklist': 'Modified checklist',
              'documents': 'Modified documents',
              'details': 'Updated shipment details',
              'commercial': 'Updated commercial details',
              'actual': 'Updated actual details',
              'shipmentType': 'Changed shipment type',
              'manualForwarderName': 'Changed forwarder',
              'manualFumigationName': 'Changed fumigation provider',
            };
            storage.createAuditLog({
              shipmentId: req.params.id,
              action: 'update',
              fieldName: key,
              oldValue: JSON.stringify(oldVal),
              newValue: JSON.stringify(newVal),
              summary: summaryMap[key] || `Updated ${key}`,
            });
          }
        });
      }

      res.json(shipment);
    } catch (error) {
      console.error("Error updating shipment:", error);
      res.status(500).json({ error: "Failed to update shipment" });
    }
  });
  
  // Delete shipment
  app.delete("/api/shipments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteShipment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shipment:", error);
      res.status(500).json({ error: "Failed to delete shipment" });
    }
  });
  
  // ============ NOTES ROUTES ============
  
  // Get all notes
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getAllNotes();
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });
  
  // Create note
  app.post("/api/notes", async (req, res) => {
    try {
      const data = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(data);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid note data", details: error.errors });
      }
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });
  
  // Update note
  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });
  
  // Delete note
  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNote(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // ============ CONTACTS ROUTES ============
  
  // Get all contacts
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });
  
  // Create contact
  app.post("/api/contacts", async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contact data", details: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });
  
  // Update contact
  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.updateContact(req.params.id, req.body);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });
  
  // Delete contact
  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteContact(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // ============ AUDIT LOG ROUTES ============
  
  // Get audit logs for a shipment
  app.get("/api/shipments/:id/audit-logs", async (req, res) => {
    try {
      const logs = await storage.getAuditLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // ============ FILE UPLOAD ROUTES (Google Drive) ============
  
  app.post("/api/files/upload", async (req, res) => {
    try {
      const { fileName, mimeType, fileContent } = req.body;

      if (!fileName || !mimeType || !fileContent) {
        return res.status(400).json({ error: 'Missing required fields: fileName, mimeType, fileContent' });
      }

      const result = await uploadFileToDrive(fileName, mimeType, fileContent);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      await deleteFileFromDrive(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Delete file error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete file' });
    }
  });

  return httpServer;
}
