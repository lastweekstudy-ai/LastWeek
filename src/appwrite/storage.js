import { storage } from './config';
import { ID } from 'appwrite';

const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID;

export const uploadFile = async (file) => {
  try {
    if (!BUCKET_ID) {
      throw new Error('Storage bucket ID not configured. Please check your .env file.');
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload PDF, Word, text, or image files.');
    }

    const response = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file
    );
    return response;
  } catch (error) {
    console.error('Upload file error:', error);
    
    // Handle SSL/Network errors
    if (error.message.includes('SSL') || error.message.includes('fetch') || error.message.includes('ERR_SSL_PROTOCOL_ERROR')) {
      throw new Error('Network connection error. Please check your internet connection and try again.');
    }
    
    throw new Error(error.message);
  }
};

export const getFilePreview = (fileId) => {
  try {
    if (!BUCKET_ID) {
      throw new Error('Storage bucket ID not configured');
    }
    const url = storage.getFilePreview(BUCKET_ID, fileId);
    return url;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getFileDownload = (fileId) => {
  try {
    if (!BUCKET_ID) {
      throw new Error('Storage bucket ID not configured');
    }
    const url = storage.getFileDownload(BUCKET_ID, fileId);
    return url;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getFileView = (fileId) => {
  try {
    if (!BUCKET_ID) {
      throw new Error('Storage bucket ID not configured');
    }
    const url = storage.getFileView(BUCKET_ID, fileId);
    return url;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Alias for getFileView - used by PDF viewer
export const getFileURL = (fileId) => {
  return getFileView(fileId);
};

export const getFileContent = async (fileId) => {
  try {
    if (!BUCKET_ID) {
      throw new Error('Storage bucket ID not configured');
    }
    
    // Get the file download URL
    const downloadUrl = storage.getFileDownload(BUCKET_ID, fileId);
    
    // Fetch the file content
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error('Failed to download file from storage');
    }
    
    // Return as blob for further processing
    return await response.blob();
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteFile = async (fileId) => {
  try {
    if (!BUCKET_ID) {
      throw new Error('Storage bucket ID not configured');
    }
    await storage.deleteFile(BUCKET_ID, fileId);
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
};