export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  description?: string;
}

export interface DataRow {
  [key: string]: any;
}

export interface DataSet {
  fields: DataField[];
  rows: DataRow[];
}

// Add any other type definitions that might be needed across the application 