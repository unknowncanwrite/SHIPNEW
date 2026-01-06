# Google Drive Vercel Setup Guide

Follow these steps to make Google Drive work after you deploy to Vercel.

### 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** > **New Project**. Name it "ShipView" and click **Create**.

### 2. Enable Google Drive API
1. In the sidebar, go to **APIs & Services** > **Library**.
2. Search for "Google Drive API", click it, and click **Enable**.

### 3. Create a Service Account
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** > **Service account**.
3. Name it "shipview-service", click **Create and Continue**.
4. Click **Select a role** > **Basic** > **Editor**. Click **Continue**, then **Done**.
5. Find your new service account in the list, click the **Edit (pencil icon)**.
6. Go to the **Keys** tab > **Add Key** > **Create new key**.
7. Select **JSON** and click **Create**. A file will download. **Keep this file safe!**

### 4. Share your Google Drive Folder
1. Go to your Google Drive.
2. Create a new folder (e.g., "ShipView Documents").
3. Right-click the folder > **Share**.
4. Paste the email address of your Service Account (found in the JSON file you downloaded).
5. Give it **Editor** access and click **Send**.

### 5. Add Vercel Environment Variables
Copy these values from your downloaded JSON file into your Vercel Project Settings (Environment Variables):

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Paste the `client_email` from the JSON.
- `GOOGLE_PRIVATE_KEY`: Paste the `private_key` from the JSON (including the `-----BEGIN PRIVATE KEY-----` parts).
- `GOOGLE_DRIVE_FOLDER_ID`: Go to your Google Drive folder, the ID is the long string of letters/numbers at the end of the URL (after `/folders/`).

Once these are set in Vercel, your app will be able to upload files directly to your folder!
