import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await c.from('podcasts').select('*').limit(1);
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  }
}

run();
