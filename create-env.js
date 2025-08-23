import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://nexxulmmmcmekbzftvvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leHh1bG1tbWNtZWtiemZ0dnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDE2NzEsImV4cCI6MjA1MTQxNzY3MX0.4uZvKpCeZcZziBSJmaEPpfHAg9B1zJ6qx1L5DAc1xuU

# Add your actual Supabase credentials here
# Replace the values above with your real project URL and anon key
# You can find these in your Supabase dashboard under Settings > API
`;

const envPath = path.join(__dirname, '.env');

try {
  if (fs.existsSync(envPath)) {
    console.log('.env file already exists. Skipping creation.');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('.env file created successfully!');
    console.log('Please update the VITE_SUPABASE_ANON_KEY with your actual anon key from your Supabase dashboard.');
  }
} catch (error) {
  console.error('Error creating .env file:', error);
} 