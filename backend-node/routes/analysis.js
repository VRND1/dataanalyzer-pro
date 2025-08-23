import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';
import XLSX from 'xlsx';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer with better settings for large files
const upload = multer({ 
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// POST /analyze - Accepts a CSV or Excel file and returns analysis results
router.post('/analyze', upload.single('file'), async (req, res) => {
  let worker;
  
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Processing file: ${file.originalname}, Size: ${file.size} bytes`);
    const startTime = Date.now();

    let data = [];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ext === '.csv') {
      // Optimized CSV parsing with streaming and chunking
      data = await parseCSVOptimized(file.path);
    } else if (ext === '.xlsx' || ext === '.xls') {
      // Optimized Excel parsing
      data = await parseExcelOptimized(file.path);
    } else {
      cleanupFile(file.path);
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    console.log(`File parsed in ${Date.now() - startTime}ms, Rows: ${data.length}`);

    // Early validation
    if (!data || data.length === 0) {
      cleanupFile(file.path);
      return res.status(400).json({ error: 'No data found in file' });
    }

    // Sample large datasets for faster processing
    const maxRows = 10000; // Configurable limit
    if (data.length > maxRows) {
      console.log(`Large dataset detected (${data.length} rows), sampling ${maxRows} rows`);
      data = sampleData(data, maxRows);
    }

    // Optimized field conversion with type inference
    const fields = convertToFields(data);
    
    console.log(`Starting analysis with ${fields.length} fields`);

    // Set timeout for worker
    const workerTimeout = 30000; // 30 seconds

    // Create worker with correct path to TypeScript file
    const workerPath = path.resolve(__dirname, '../../src/workers/analysisWorker.ts');
    if (!fs.existsSync(workerPath)) {
      throw new Error(`Worker file not found: ${workerPath}`);
    }
    
    worker = new Worker(workerPath);
    
    const analysisPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Analysis timeout - processing took too long'));
      }, workerTimeout);

      worker.on('message', (msg) => {
        clearTimeout(timeout);
        if (msg.success) {
          resolve(msg.result);
        } else {
          reject(new Error(msg.error || 'Analysis failed'));
        }
      });

      worker.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      // Send data to worker
      worker.postMessage({ 
        fields,
        options: {
          sampleSize: Math.min(1000, data.length), // Limit sample size for worker
          maxProcessingTime: 25000 // Give worker 25s to complete
        }
      });
    });

    const result = await analysisPromise;
    
    console.log(`Analysis completed in ${Date.now() - startTime}ms`);
    
    res.json({ 
      success: true, 
      result,
      metadata: {
        originalRows: data.length,
        fieldsAnalyzed: fields.length,
        processingTime: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Analysis failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Cleanup
    if (req.file) {
      cleanupFile(req.file.path);
    }
    if (worker) {
      await worker.terminate();
    }
  }
});

// Optimized CSV parsing function
async function parseCSVOptimized(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const fileStream = fs.createReadStream(filePath);
    
    Papa.parse(fileStream, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      fastMode: true, // Enable fast mode for better performance
      chunk: (chunk) => {
        // Process in chunks to avoid memory issues
        results.push(...chunk.data);
      },
      complete: () => {
        console.log(`CSV parsed: ${results.length} rows`);
        resolve(results);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      }
    });
  });
}

// Optimized Excel parsing function
async function parseExcelOptimized(filePath) {
  try {
    const workbook = XLSX.readFile(filePath, {
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Use more efficient conversion
    const data = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      blankrows: false
    });
    
    console.log(`Excel parsed: ${data.length} rows`);
    return data;
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw error;
  }
}

// Sample large datasets using systematic sampling
function sampleData(data, maxRows) {
  if (data.length <= maxRows) return data;
  
  const step = Math.floor(data.length / maxRows);
  const sampled = [];
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
    if (sampled.length >= maxRows) break;
  }
  
  return sampled;
}

// Optimized field conversion with better type inference
function convertToFields(data) {
  if (!data || data.length === 0) return [];
  
  const sampleSize = Math.min(100, data.length); // Sample for type inference
  const sample = data.slice(0, sampleSize);
  
  const fieldNames = Object.keys(data[0] || {});
  
  return fieldNames.map(fieldName => {
    // Infer type from sample
    const sampleValues = sample.map(row => row[fieldName]).filter(val => val !== null && val !== undefined);
    const type = inferFieldType(sampleValues);
    
    // Extract values more efficiently
    const values = data.map(row => row[fieldName]);
    
    return {
      name: fieldName,
      type,
      values,
      sampleSize: sampleValues.length
    };
  }).filter(field => field.sampleSize > 0); // Remove empty fields
}

// Better type inference
function inferFieldType(values) {
  if (values.length === 0) return 'string';
  
  let numberCount = 0;
  let dateCount = 0;
  
  for (const value of values) {
    if (typeof value === 'number' && !isNaN(value)) {
      numberCount++;
    } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      dateCount++;
    }
  }
  
  const threshold = values.length * 0.8; // 80% threshold
  
  if (numberCount >= threshold) return 'number';
  if (dateCount >= threshold) return 'date';
  return 'string';
}

// Cleanup helper
function cleanupFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) console.error('Failed to cleanup file:', err);
  });
}

export default router;