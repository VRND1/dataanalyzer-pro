/// <reference lib="webworker" />

import { parse } from 'papaparse';
import { inferFieldType } from '../inference';

self.onmessage = (e: MessageEvent) => {
  const { file } = e.data;
  let headers: string[] = [];
  const fieldValues: Record<string, any[]> = {};
  let rowCount = 0;

  parse(file, {
    chunk: (results) => {
      const rows = results.data as any[][];
      if (rowCount === 0 && rows.length > 0) {
        headers = rows[0].map(String);
        headers.forEach(header => {
          fieldValues[header] = [];
        });
        rows.slice(1).forEach(row => {
          headers.forEach((header, i) => {
            fieldValues[header].push(row[i]);
          });
        });
      } else {
        rows.forEach(row => {
          headers.forEach((header, i) => {
            fieldValues[header].push(row[i]);
          });
        });
      }
      
      rowCount += rows.length;
      
      // Report progress
      self.postMessage({ 
        type: 'progress', 
        payload: { processed: rowCount }
      });
    },
    complete: () => {
      if (headers.length === 0) {
        self.postMessage({ 
          type: 'error', 
          payload: 'No headers found in CSV' 
        });
        return;
      }

      const fields = headers.map(header => ({
        name: header,
        type: inferFieldType(fieldValues[header]),
        value: fieldValues[header]
      }));

      self.postMessage({ 
        type: 'complete', 
        payload: { fields } 
      });
    },
    error: (error) => {
      self.postMessage({ 
        type: 'error', 
        payload: error.message 
      });
    },
    header: false,
    skipEmptyLines: true,
    chunkSize: 1000
  });
};