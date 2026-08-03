import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  setDoc,
  getCountFromServer,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../lib/firebase';
import { DocumentFile, DocumentFolder } from '../types';
import { uploadToCloudinary } from '../../../shared/utils/cloudinary';

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function compressAndResizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Max width/height of 1200px for robust compression under 1MB limit
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Export as JPEG with 0.7 quality to guarantee small file size (usually < 200KB)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(dataUrl);
    };
    img.onerror = (err) => reject(err);
  });
}


export const documentService = {
  // Folders
  subscribeToFolders: (companyId: string, parentId: string | null, callback: (folders: DocumentFolder[]) => void) => {
    const q = query(
      collection(db, 'folders'),
      where('companyId', '==', companyId),
      where('parentId', '==', parentId),
      where('active', '==', true)
    );

    return onSnapshot(
      q, 
      (snapshot) => {
        const folders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DocumentFolder[];

        folders.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        callback(folders);
      },
      (error) => {
        console.error("Error subscribing to folders:", error);
        callback([]);
      }
    );
  },

  createFolder: async (folderData: Omit<DocumentFolder, 'id' | 'createdAt' | 'updatedAt' | 'active'>) => {
    try {
      return await addDoc(collection(db, 'folders'), {
        ...folderData,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'folders');
    }
  },

  getOrCreateFolderByName: async (companyId: string, name: string): Promise<string> => {
    try {
      const q = query(
        collection(db, 'folders'),
        where('companyId', '==', companyId),
        where('name', '==', name),
        where('parentId', '==', null),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      const docRef = await addDoc(collection(db, 'folders'), {
        companyId,
        parentId: null,
        name,
        path: `/${name}`,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error in getOrCreateFolderByName:", error);
      throw error;
    }
  },

  // Files
  subscribeToFiles: (companyId: string, folderId: string | null, callback: (files: DocumentFile[]) => void) => {
    const q = query(
      collection(db, 'documents'),
      where('companyId', '==', companyId),
      where('folderId', '==', folderId),
      where('active', '==', true)
    );

    return onSnapshot(
      q, 
      (snapshot) => {
        const files = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DocumentFile[];

        files.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        callback(files);
      },
      (error) => {
        console.error("Error subscribing to files:", error);
        callback([]);
      }
    );
  },

  subscribeToCardFiles: (companyId: string, cardId: string, callback: (files: DocumentFile[]) => void) => {
    const q = query(
      collection(db, 'documents'),
      where('companyId', '==', companyId),
      where('cardId', '==', cardId),
      where('active', '==', true)
    );

    return onSnapshot(
      q, 
      (snapshot) => {
        const files = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DocumentFile[];

        files.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return timeB - timeA;
        });

        callback(files);
      },
      (error) => {
        console.error("Error subscribing to card files:", error);
        callback([]);
      }
    );
  },

  uploadFile: async (
    file: File, 
    companyId: string, 
    folderId: string | null,
    userId: string,
    cardId?: string | null
  ) => {
    let url = '';
    let usedFallback = false;

    try {
      // 1. Try Client-side Cloudinary if configured
      const clientCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (clientCloudName && clientCloudName !== 'undefined' && clientCloudName !== 'ml_default') {
        try {
          url = await uploadToCloudinary(file);
        } catch (cloudinaryError: any) {
          console.warn("Client-side Cloudinary upload failed, falling back to server:", cloudinaryError);
        }
      }

      // 2. Try Backend server upload
      if (!url) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('companyId', companyId);

          const response = await fetch('/api/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          const responseText = await response.text();
          let responseData: any;
          try {
            responseData = JSON.parse(responseText);
          } catch (parseError) {
            console.warn("Erro ao analisar resposta como JSON. Texto bruto:", responseText);
            throw new Error(`Resposta do servidor inválida (HTTP ${response.status}).`);
          }

          if (!response.ok) {
            throw new Error(responseData.error || `Erro de rede (HTTP ${response.status})`);
          }

          url = responseData.url;
        } catch (backendError: any) {
          console.warn("Backend upload failed/blocked, applying client-side fallback:", backendError);
          
          // 3. Client-side fallback logic
          if (file.size > 750 * 1024) {
            // If it's an image, we can compress it to fit under Firestore's 1MB limit
            if (file.type.startsWith('image/')) {
              try {
                url = await compressAndResizeImage(file);
                usedFallback = true;
              } catch (compressError) {
                console.error("Failed to compress image:", compressError);
                throw new Error(
                  `O arquivo é muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). ` +
                  `Por favor, clique em "Abrir em nova aba" no canto superior direito para habilitar o servidor de arquivos.`
                );
              }
            } else {
              throw new Error(
                `O arquivo (${(file.size / 1024 / 1024).toFixed(2)}MB) excede o limite de 1MB para upload sem servidor de mídia. ` +
                `Por favor, clique em "Abrir em nova aba" no canto superior direito da tela para ativar o servidor de arquivos local.`
              );
            }
          } else {
            // Small enough to save as base64 in Firestore directly
            url = await readFileAsDataURL(file);
            usedFallback = true;
          }
        }
      }

      // 4. Save metadata to Firestore with unique document ID via addDoc
      return await addDoc(collection(db, 'documents'), {
        companyId,
        folderId: folderId || null,
        cardId: cardId || null,
        name: file.name,
        size: usedFallback && url.startsWith('data:') ? Math.round(url.length * 0.75) : file.size,
        type: file.type,
        url,
        category: 'other',
        uploadedBy: userId,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error("Upload Error:", error);
      throw new Error(error.message || 'Erro desconhecido no upload');
    }
  },

  deleteFile: async (fileId: string) => {
    try {
      const fileRef = doc(db, 'documents', fileId);
      return await deleteDoc(fileRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `documents/${fileId}`);
    }
  },

  deleteFolder: async (folderId: string) => {
    try {
      // Delete all files in this folder
      const filesQuery = query(collection(db, 'documents'), where('folderId', '==', folderId));
      const filesSnapshot = await getDocs(filesQuery);
      
      const batch = writeBatch(db);
      filesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Also delete the folder itself
      const folderRef = doc(db, 'folders', folderId);
      batch.delete(folderRef);

      return await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `folders/${folderId}`);
    }
  }
};
