// Load environment variables once for the entire application
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load from root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Verify critical variables are loaded
const requiredVars = ['GROQ_API_KEY', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'JWT_SECRET', 'GITHUB_GIST_TOKEN'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.warn('⚠️  WARNING: Missing environment variables:', missing.join(', '));
  console.warn('⚠️  The app will start but some features may not work.');
  console.warn('⚠️  Please check your .env file in the root directory.');
}

export default process.env;