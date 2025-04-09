import config from '../config';
import apiService from '../services/apiService';
const { apiRequest } = apiService;

export const readDirectory = async () => {
  try {
    const data = await apiRequest(`${config.API_URL}/teachers`);
    console.log('API Response:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
};

const parseFileName = (fileName) => {
  // Log the input filename
  console.log('Parsing filename:', fileName);

  // First try to find the class code after the timestamp
  const timestampClassPattern = /\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\+\d{4}-([gknpGKNP][0-9]+)/;
  const timestampMatch = fileName.match(timestampClassPattern);
  
  if (timestampMatch && timestampMatch[1]) {
    const classCode = timestampMatch[1].toUpperCase();
    console.log('Found class code after timestamp:', classCode);
    return {
      classCode,
      fileName,
      originalFileName: fileName, // Ensure original file name is captured
      displayName: fileName
    };
  }

  // Fallback: try to find any class code pattern in the filename
  const classCodePattern = /[gknpGKNP][0-9]+/;
  const match = fileName.match(classCodePattern);
  
  const classCode = match ? match[0].toUpperCase() : 'Unknown Class';
  console.log('Final class code:', classCode);

  return {
    classCode,
    fileName,
    originalFileName: fileName, // Ensure original file name is captured
    displayName: fileName
  };
};