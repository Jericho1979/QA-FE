# Google Drive Integration Guide for RHET-Zoom-Archive

This guide explains how to set up, test, and use the Google Drive integration for the RHET-Zoom-Archive project.

## Setup Process

### 1. Authentication Setup

The first step is to authenticate with Google Drive:

```bash
# Navigate to the backend directory
cd project1-backend

# Run the authentication setup script
node setup-drive-auth.js
```

This will display a URL that you need to open in your browser. After authorizing the application, you'll receive a code to paste back into the terminal.

### 2. Verify Authentication

After successful authentication, a `token.json` file will be created in the project1-backend directory. This token allows the application to access Google Drive without requiring user interaction each time.

### 3. Start the Server

Start the server to enable Google Drive functionality:

```bash
# Make sure you're in the project1-backend directory
cd project1-backend

# Start the server
npm run dev
```

### 4. Start the Frontend

In a separate terminal:

```bash
# Navigate to the frontend directory
cd project1

# Start the frontend development server
npm run dev
```

## Testing the Integration

### Backend Testing

1. **Check Teacher Folders**

   Access the endpoint to list teacher folders from Google Drive:
   
   ```
   http://localhost:3002/api/teachers
   ```
   
   This should return a list of teachers with their recordings, including fileId properties for files stored in Google Drive.

2. **Test Video Streaming**

   To test a direct stream from Google Drive, use this endpoint (replace `{fileId}` with an actual file ID):
   
   ```
   http://localhost:3002/stream-drive/{fileId}
   ```

3. **Test Video Download**

   To test downloading a file from Google Drive, use:
   
   ```
   http://localhost:3002/download-drive/{fileId}
   ```

### Frontend Testing

1. **Teacher Dashboard**

   - Log in as a teacher
   - Navigate to the videos section
   - Select a recording to play or download
   - Verify that videos stream correctly and downloads work

2. **QA Recordings View**

   - Log in as a QA user
   - Navigate to a teacher's recordings
   - Test playback and downloads for recordings
   - Verify that the recording details page shows the video correctly

## How It Works

### File Identification

The system now supports two ways to access video files:

1. **Traditional Method**: Using teacher email and filename
   - URL pattern: `/stream/{teacherEmail}/{filename}`
   - Used as fallback when Google Drive file ID is not available

2. **Google Drive Method**: Using Google Drive file ID
   - URL pattern: `/stream-drive/{fileId}`
   - Direct access to files stored in Google Drive

The system automatically uses the most appropriate method based on the availability of the `fileId` property.

### API Service

The frontend's `apiService.js` includes two helper functions for generating URLs:

- `getVideoPlaybackUrl(teacherEmail, fileName, fileId)`: Generates video streaming URLs
- `getVideoDownloadUrl(teacherEmail, fileName, fileId)`: Generates video download URLs

These functions prioritize Google Drive access when a fileId is available.

### Directory Structure in Google Drive

The Google Drive integration expects this folder structure:

```
RHET-Zoom-Archive (root folder)
├── teacher1@example.com (teacher folder)
│   ├── video1.mp4
│   ├── video2.mp4
│   └── ...
├── teacher2@example.com (teacher folder)
│   └── ...
└── ...
```

Each teacher's email address serves as their folder name, making it easy to organize and retrieve recordings.

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

1. Delete the `token.json` file
2. Run `node setup-drive-auth.js` again
3. Complete the authentication process

### Missing Files

If files are not appearing:

1. Verify the folder structure in Google Drive matches the expected format
2. Check that the ROOT_FOLDER_ID in drive-service.js is correct
3. Ensure the files have the correct MIME type (video/*)

### Streaming Issues

If videos don't stream properly:

1. Check browser console for errors
2. Verify the file exists in Google Drive
3. Ensure the file is a supported video format
4. Try accessing the direct stream-drive endpoint in a new browser tab

## Moving Forward

This integration provides a seamless transition from local file storage to Google Drive, maintaining all existing functionality while adding the benefits of cloud storage. Users should notice no difference in the interface, as all URL generation happens behind the scenes.

To add new videos:

1. Upload them to the appropriate teacher folder in Google Drive
2. The system will automatically detect and include them in the teacher's recordings list
3. All streaming, downloading, and evaluation features will work with the new files 