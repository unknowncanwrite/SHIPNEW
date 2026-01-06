import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

export async function getGoogleDriveClient() {
  // Check for Service Account credentials (Vercel)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null as any,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive']
    );
    return google.drive({ version: 'v3', auth });
  }

  // Fallback to Replit Connector (Local/Replit)
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function uploadFileToDrive(
  fileName: string,
  mimeType: string,
  fileContent: Buffer | string,
  folderId?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const drive = await getGoogleDriveClient();
  
  const fileMetadata: any = {
    name: fileName,
  };
  
  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType,
    body: typeof fileContent === 'string' 
      ? require('stream').Readable.from(Buffer.from(fileContent, 'base64'))
      : require('stream').Readable.from(fileContent),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, webViewLink',
  });

  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return {
    id: response.data.id!,
    name: response.data.name!,
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
  };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = await getGoogleDriveClient();
  await drive.files.delete({ fileId });
}

export async function getFileFromDrive(fileId: string): Promise<{ name: string; mimeType: string; data: Buffer }> {
  const drive = await getGoogleDriveClient();
  
  const metadata = await drive.files.get({
    fileId,
    fields: 'name, mimeType',
  });

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return {
    name: metadata.data.name!,
    mimeType: metadata.data.mimeType!,
    data: Buffer.from(response.data as ArrayBuffer),
  };
}
