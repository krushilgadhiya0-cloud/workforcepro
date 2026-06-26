import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

// Setup Redis (Source)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Setup Supabase (Destination)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role for admin access

const KV_KEY = 'workforce:app-data';
const SUPABASE_TABLE = 'app_storage';

async function migrate() {
  console.log('🚀 Starting Migration: Redis -> Supabase');

  if (!redisUrl || !redisToken) {
    console.error('❌ Redis credentials missing in .env.local');
    return;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing in .env.local (Make sure you have SUPABASE_SERVICE_ROLE_KEY)');
    return;
  }

  try {
    // 1. Connect to Redis
    const redis = new Redis({ url: redisUrl, token: redisToken });
    console.log('📡 Connected to Redis...');

    // 2. Fetch Data
    const data = await redis.get(KV_KEY);
    if (!data) {
      console.log('⚠️ No data found in Redis. Nothing to migrate.');
      return;
    }
    console.log('✅ Data fetched from Redis.');

    // 3. Connect to Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('📡 Connected to Supabase...');

    // 4. Save to Supabase
    const { error } = await supabase
      .from(SUPABASE_TABLE)
      .upsert({ 
        key: KV_KEY, 
        data: data, 
        updated_at: new Date().toISOString() 
      });

    if (error) {
      if (error.code === '42P01') {
        console.error('❌ Table "app_storage" does not exist in Supabase.');
        console.log('👉 Please run the SQL I provided earlier in your Supabase SQL Editor first!');
      } else {
        console.error('❌ Supabase Error:', error.message);
      }
      return;
    }

    console.log('🎉 Migration Successful! Your data is now in Supabase.');
    console.log('You can now safely switch your Vercel environment variables to use Supabase.');

  } catch (err) {
    console.error('❌ Fatal Migration Error:', err);
  }
}

migrate();
