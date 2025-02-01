import api from '../lib/axios';
import toast from 'react-hot-toast';

export const validateImageFile = (file: File) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG and WebP images are allowed');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image size should be less than 5MB');
  }

  return true;
};

export const uploadFile = async (file: File, prefix = ''): Promise<string> => {
  try {
    if (!file) {
      throw new Error('No file selected');
    }

    validateImageFile(file);
    
    const formData = new FormData();
    formData.append('image', file);

    const { data } = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 second timeout
    });

    if (!data?.url) {
      throw new Error('No URL returned from server');
    }

    return data.url;
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
      toast.error(error.message);
      throw error;
    } else {
      toast.error('Failed to upload file. Please try again.');
      throw new Error('Failed to upload file');
    }
  }
};