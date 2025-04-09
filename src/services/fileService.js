// Remove the Node.js imports that aren't available in browser
import config from '../config';
import apiService from '../services/apiService';

// Define constants from config for easy access
const API_URL = config.API_URL;
const VIDEO_STREAM_URL = config.video.baseStreamUrl;
const DRIVE_STREAM_URL = config.video.baseDriveStreamUrl;
const VIDEO_DOWNLOAD_URL = config.video.baseDownloadUrl;
const DRIVE_DOWNLOAD_URL = config.video.baseDriveDownloadUrl;
const { apiRequest } = apiService;

export const getUserVideos = async (username) => {
  try {
    console.log('Fetching videos for username:', username);
    
    // Get all teachers data which includes their recordings
    const teachers = await apiRequest(`${API_URL}/teachers`);
    console.log('Teachers data received:', teachers);
    
    // Clean up the input username - remove email domain if present and 't.' prefix
    const cleanUsername = username.split('@')[0].replace('t.', '').toLowerCase();
    console.log('Cleaned username:', cleanUsername);
    
    // Find the specific teacher's data by matching just the name part of the email
    const teacherData = teachers.find(teacher => {
      const teacherUsername = teacher.email.split('@')[0].replace('t.', '').toLowerCase();
      console.log('Comparing with teacher:', teacherUsername);
      return teacherUsername === cleanUsername;
    });
    
    console.log('Teacher data found:', teacherData);
    
    if (!teacherData || !teacherData.recordings) {
      console.log('No recordings found for this teacher');
      return [];
    }

    // Fetch teacher stats to get evaluation information
    let teacherStats = null;
    try {
      // Attempt to fetch teacher stats to get evaluation data
      const normalizedTeacherId = `t.${cleanUsername}@little-champions.com`;
      teacherStats = await apiRequest(`${API_URL}/teacher-stats/${encodeURIComponent(normalizedTeacherId)}`);
      console.log('Teacher stats loaded:', teacherStats);
    } catch (statsError) {
      console.warn('Could not load teacher stats:', statsError);
    }

    // Return the teacher's recordings with the correct path structure
    return teacherData.recordings.map(recording => {
      // Extract teacher email from the recording path
      const teacherEmail = teacherData.email;
      console.log('Processing recording:', recording);
      
      // Safe date parsing
      let date;
      try {
        // Try to parse date from the filename format YYYY.MM.DD-HH.MM
        const datePart = recording.name.split('-')[0];
        date = new Date(datePart.replace(/\./g, '-'));
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          // Fallback to current date
          date = new Date();
        }
      } catch (error) {
        console.error('Error parsing date:', error);
        date = new Date(); // Fallback to current date
      }
      
      // Clean up the filename to ensure it's properly formatted
      const cleanFileName = recording.name.trim();
      
      // Construct the video URLs using either file ID (if available) or the traditional path
      let streamUrl, staticUrl, downloadUrl;
      
      if (recording.fileId) {
        // Use Google Drive endpoints if fileId is available
        streamUrl = `${DRIVE_STREAM_URL}/${recording.fileId}`;
        staticUrl = `${DRIVE_STREAM_URL}/${recording.fileId}`;
        downloadUrl = `${DRIVE_DOWNLOAD_URL}/${recording.fileId}`;
        console.log('Using Google Drive URLs with fileId:', recording.fileId);
      } else {
        // Fallback to traditional URLs
        streamUrl = `${VIDEO_STREAM_URL}/${encodeURIComponent(teacherEmail)}/${encodeURIComponent(cleanFileName)}`;
        staticUrl = `${VIDEO_STREAM_URL}/${encodeURIComponent(teacherEmail)}/${encodeURIComponent(cleanFileName)}`;
        downloadUrl = `${VIDEO_DOWNLOAD_URL}/${encodeURIComponent(teacherEmail)}/${encodeURIComponent(cleanFileName)}`;
      }
      
      console.log('Constructed video URLs:', { 
        streamUrl,
        staticUrl,
        downloadUrl
      });
      
      // Check if this recording is evaluated
      // First check recording's own evaluated property, then check teacher data's evaluated recordings list
      const isEvaluated = 
        recording.evaluated || 
        (teacherData.evaluatedRecordings && teacherData.evaluatedRecordings.includes(cleanFileName)) ||
        (teacherStats && teacherStats.recentEvaluations && 
         teacherStats.recentEvaluations.some(evaluation => evaluation.recordingName === cleanFileName));
      
      return {
        name: cleanFileName,
        fileName: cleanFileName,
        path: staticUrl, // Use the static URL as the primary path
        streamUrl: streamUrl,
        downloadUrl: downloadUrl,
        date: date,
        size: recording.size || 0,
        type: '.mp4',
        displayName: recording.displayName || cleanFileName,
        originalFileName: cleanFileName,
        teacherEmail: teacherEmail,
        evaluated: isEvaluated, // Add the evaluated flag
        duration: recording.duration || 0, // Ensure duration is included
        fileId: recording.fileId || null // Include the fileId if it exists
      };
    });
  } catch (error) {
    console.error('Error in getUserVideos:', error);
    throw error;
  }
};
