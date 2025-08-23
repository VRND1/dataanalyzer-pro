import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FileData } from '@/types/file';
import { createError } from '../core/error';
import { validateStorageData } from '../validation/storage';

interface AnalysisDB extends DBSchema {
  analysisData: {
    key: string;
    value: FileData;
  };
}

const DB_NAME = 'analysisDB';
const STORE_NAME = 'analysisData';

let db: IDBPDatabase<AnalysisDB> | null = null;

async function getDB() {
  if (!db) {
    db = await openDB<AnalysisDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return db;
}

export async function storeAnalysisData(data: FileData): Promise<void> {
  try {
    const db = await getDB();
    
    // Validate data structure
    const validationResult = validateStorageData(data);
    
    // Validate data structure
    if (!validationResult.isValid) {
      throw createError('PROCESSING_FAILED', validationResult.error || 'Invalid data structure');
    }

    const minimalData = {
      type: data.type,
      name: data.name,
      content: {
        fields: data.content.fields.map(field => ({
          name: field.name,
          type: field.type,
          value: field.type === 'number' 
            ? field.value.map(v => Number(v))
            : field.type === 'date'
            ? field.value.map(v => new Date(v))
            : field.value.map(v => String(v))
        }))
      }
    };

    try {
      // Clear existing data first
      await clearAnalysisData();

      // Attempt IndexedDB storage
      await db.put(STORE_NAME, minimalData, 'currentAnalysis');
    } catch (storageError) {
      console.warn('IndexedDB storage failed, falling back to sessionStorage:', storageError);
      
      try {
        const serializedData = JSON.stringify(minimalData);
        sessionStorage.removeItem('analysisData'); // Clear existing data
        sessionStorage.setItem('analysisData', serializedData);
      } catch (fallbackError) {
        console.error('All storage methods failed:', fallbackError);
        throw createError('PROCESSING_FAILED', 'Unable to store analysis data - dataset may be too large');
      }
    }
  } catch (error) {
    console.error('Error storing analysis data:', error);
    throw error;
  }
}

export async function getAnalysisData(): Promise<FileData | null> {
  try {
    const db = await getDB();
    let data: FileData | null = null;

    try {
      data = await db.get(STORE_NAME, 'currentAnalysis') ?? null;
      if (data) return data;

      // Try fallback storage
      const fallbackData = sessionStorage.getItem('analysisData');
      if (fallbackData) {
        try {
          const parsedData = JSON.parse(fallbackData);
          if (isValidAnalysisData(parsedData)) {
            return parsedData;
          }
        } catch (parseError) {
          console.error('Failed to parse fallback data:', parseError);
        }
      }
      return null;
    } catch (error) {
      console.error('Database access error:', error);
      throw createError('PROCESSING_FAILED', 'Failed to access analysis data');
    }
  } catch (error) {
    console.error('Error retrieving analysis data:', error);
    throw error;
  }
}

function isValidAnalysisData(data: any): data is FileData {
  return (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    'name' in data &&
    'content' in data &&
    data.content &&
    Array.isArray(data.content.fields) &&
    data.content.fields.length > 0 &&
    data.content.fields.every((field: any) =>
      field &&
      typeof field === 'object' &&
      'name' in field &&
      'type' in field &&
      'value' in field &&
      Array.isArray(field.value)
    )
  );
}

export async function clearAnalysisData(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, 'currentAnalysis');
    sessionStorage.removeItem('analysisData');
  } catch (error) {
    console.error('Error clearing analysis data:', error);
  }
}