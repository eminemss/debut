const RSVP_RECIPIENT = 'meriankriztelnaive@gmail.com';
const DRIVE_FOLDER_NAME = "Merian's 18th Birthday Memories";
const DRIVE_FOLDER_PROPERTY = 'MEMORIES_DRIVE_FOLDER_ID';
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

function setup() {
  const properties = PropertiesService.getScriptProperties();
  let folderId = properties.getProperty(DRIVE_FOLDER_PROPERTY);
  if (!folderId) {
    const folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
    folderId = folder.getId();
    properties.setProperty(DRIVE_FOLDER_PROPERTY, folderId);
  }
  MailApp.getRemainingDailyQuota();
  return folderId;
}

function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      throw new Error('A JSON request body is required.');
    }

    const request = JSON.parse(event.postData.contents);
    if (request.action === 'rsvp') {
      return sendAttendanceConfirmation(request);
    }
    if (request.action === 'upload') {
      return savePhoto(request);
    }
    throw new Error('Unsupported request action.');
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: error.message || 'Request failed.' });
  }
}

function sendAttendanceConfirmation(request) {
  const name = String(request.name || '').trim();
  const confirmation = String(request.confirmation || '').trim();
  if (!name || name.length > 100) {
    throw new Error('Please provide a name of 1 to 100 characters.');
  }
  if (!confirmation || confirmation.length > 500) {
    throw new Error('Please provide an attendance confirmation of 1 to 500 characters.');
  }

  MailApp.sendEmail({
    to: RSVP_RECIPIENT,
    subject: `Birthday attendance confirmation from ${name}`,
    body: `Name: ${name}\n\nAttendance and tradition confirmation:\n${confirmation}\n\nReceived: ${new Date().toISOString()}`
  });
  return jsonResponse({ ok: true });
}

function savePhoto(request) {
  const fileName = String(request.name || '').replace(/[\\/:*?"<>|]/g, '_').slice(0, 150);
  const mimeType = String(request.mimeType || '');
  const encodedData = String(request.data || '');
  if (!fileName || !/^image\/[a-z0-9.+-]+$/i.test(mimeType) || !/^[A-Za-z0-9+/]+=*$/.test(encodedData)) {
    throw new Error('The photo details are invalid.');
  }
  if (encodedData.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3)) {
    throw new Error('The photo is larger than 8 MB.');
  }

  const folderId = PropertiesService.getScriptProperties().getProperty(DRIVE_FOLDER_PROPERTY);
  if (!folderId) {
    throw new Error('Run setup() once before deploying the web app.');
  }

  const imageBytes = Utilities.base64Decode(encodedData);
  if (imageBytes.length > MAX_IMAGE_BYTES) {
    throw new Error('The photo is larger than 8 MB.');
  }
  const image = Utilities.newBlob(imageBytes, mimeType, fileName);
  const file = DriveApp.getFolderById(folderId).createFile(image);
  return jsonResponse({ ok: true, fileId: file.getId() });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
