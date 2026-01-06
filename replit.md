# ShipView - Shipment Management Application

## Overview
A shipment management application that tracks shipments, notes, and contacts with audit logging capabilities.

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Supabase PostgreSQL (via Drizzle ORM)
- **File Storage**: Google Drive (via Replit integration)
- **Deployment**: Vercel (serverless functions)

## Vercel Deployment

### Required Environment Variables
Set these in Vercel project settings:
- `SUPABASE_DATABASE_URL` - Supabase PostgreSQL connection string

### Deployment Steps
1. Push code to GitHub repository
2. Connect Vercel to the GitHub repository
3. Configure environment variables in Vercel dashboard
4. Deploy

### Project Structure for Vercel
- `/api` - Serverless API functions
- `/client` - Frontend React application
- `vercel.json` - Vercel configuration

## Google Drive Integration
Documents uploaded to shipments are stored in Google Drive:
- Uses Replit's Google Drive connector for authentication
- Files are uploaded with public read access for easy sharing
- Document links are stored in PostgreSQL, not the file content

## GitHub Sync
- Repository: https://github.com/unknowncanwrite/ship
- Method: Git CLI with Personal Access Token (classic) with `repo` scope

## API Routes
- `GET/POST /api/shipments` - List/create shipments
- `GET/PATCH/DELETE /api/shipments/[id]` - Single shipment operations
- `GET /api/shipments/[id]/audit-logs` - Shipment audit history
- `GET/POST /api/notes` - List/create notes
- `PATCH/DELETE /api/notes/[id]` - Note operations
- `GET/POST /api/contacts` - List/create contacts
- `PATCH/DELETE /api/contacts/[id]` - Contact operations
- `POST /api/files/upload` - Upload file to Google Drive
- `GET/DELETE /api/files/[id]` - Get/delete file from Google Drive

## Database Schema
Tables managed via Drizzle ORM:
- `shipments` - Main shipment records with JSON fields for complex data
- `notes` - Quick notes
- `contacts` - Contact information
- `audit_logs` - Change history for shipments
