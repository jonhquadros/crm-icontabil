/**
 * Cloudinary Upload Utility
 * Note: For production, unsigned uploads are recommended for client-side, 
 * or signed uploads via a backend API route to keep API_SECRET hidden.
 */

export async function uploadToCloudinary(file: File, folder?: string): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (folder) {
    formData.append('folder', folder);
  } else if (import.meta.env.VITE_CLOUDINARY_FOLDER) {
    formData.append('folder', import.meta.env.VITE_CLOUDINARY_FOLDER);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro ao fazer upload para Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}
