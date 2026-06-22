import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env manually
const envPath = '.env';
if (!fs.existsSync(envPath)) {
  console.error("Error: .env file not found.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("\nUsage:\n  node create-user.js <email> <password> [fullName]\n");
    console.log("Example:\n  node create-user.js test@ccmail.dev password123 \"Test User\"\n");
    process.exit(0);
  }

  const email = args[0];
  const password = args[1];
  const fullName = args[2] || email.split('@')[0];

  console.log(`Creating user ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName
    }
  });

  if (error) {
    console.error("Error creating user:", error.message);
  } else {
    console.log("Success! User created successfully.");
    console.log("User Details:", {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata.full_name
    });
  }
}

createUser();
