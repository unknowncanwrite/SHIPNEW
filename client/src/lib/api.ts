import type { Shipment, Note } from '@shared/schema';
import type { ShipmentData } from '@/types/shipment';

const API_BASE = '/api';

// ============ SHIPMENT API ============

export async function fetchShipments(): Promise<Shipment[]> {
  const res = await fetch(`${API_BASE}/shipments`);
  if (!res.ok) throw new Error('Failed to fetch shipments');
  return res.json();
}

export async function fetchShipment(id: string): Promise<Shipment> {
  const res = await fetch(`${API_BASE}/shipments/${id}`);
  if (!res.ok) throw new Error('Failed to fetch shipment');
  return res.json();
}

export async function createShipment(data: Partial<ShipmentData>): Promise<Shipment> {
  const res = await fetch(`${API_BASE}/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create shipment');
  return res.json();
}

export async function updateShipment(id: string, data: Partial<ShipmentData>): Promise<Shipment> {
  const res = await fetch(`${API_BASE}/shipments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update shipment');
  return res.json();
}

export async function deleteShipment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/shipments/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete shipment');
}

// ============ NOTES API ============

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/notes`);
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
}

export async function createNote(data: { name: string; notes: string }): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json();
}

export async function updateNote(id: string, data: { name?: string; notes?: string }): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update note');
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete note');
}
