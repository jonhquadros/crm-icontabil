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
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { DocumentFile, DocumentFolder } from '../types';

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
    return addDoc(collection(db, 'folders'), {
      ...folderData,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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

  uploadFile: async (
    file: File, 
    companyId: string, 
    folderId: string | null,
    userId: string
  ) => {
    try {
      // 1. Upload via backend to Cloudinary (or fallback Data URL)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar o arquivo');
      }

      const responseData = await response.json();
      const url = responseData.url;

      // 2. Save metadata to Firestore with unique document ID via addDoc
      return await addDoc(collection(db, 'documents'), {
        companyId,
        folderId: folderId || null,
        name: file.name,
        size: file.size,
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
    const fileRef = doc(db, 'documents', fileId);
    return updateDoc(fileRef, {
      active: false,
      updatedAt: serverTimestamp(),
    });
  },

  deleteFolder: async (folderId: string) => {
    const folderRef = doc(db, 'folders', folderId);
    return updateDoc(folderRef, {
      active: false,
      updatedAt: serverTimestamp(),
    });
  }
};
