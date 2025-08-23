/// <reference lib="webworker" />

// Simple query worker implementation
self.onmessage = async (e: MessageEvent) => {
  const { query, data } = e.data;

  try {
    // Process query in worker
    const result = await processQuery(query, data);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ 
      error: error instanceof Error ? error.message : 'Query execution failed' 
    });
  }
};

async function processQuery(query: string, data: any[]): Promise<any[]> {
  // Basic implementation that filters data based on the query
  if (!query || !data || data.length === 0) {
    return [];
  }
  
  // Simple filtering based on query string
  return data.filter(item => {
    // Convert item to string and check if it contains the query
    const itemString = JSON.stringify(item).toLowerCase();
    return itemString.includes(query.toLowerCase());
  });
}