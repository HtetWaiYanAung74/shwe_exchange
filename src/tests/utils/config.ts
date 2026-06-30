import dotenv from 'dotenv';
dotenv.config();

const config = {
  baseUrl: process.env.BASE_URL,
  email: process.env.EMAIL,
  gmail_password: process.env.GMAIL_PASSWORD,
  password: process.env.PASSWORD,
  twoFASecret: process.env.TWOFA_SECRET,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  supabaseSecret: process.env.SUPABASE_SECRET_KEY,
  supabaseJWKSUrl: process.env.SUPABASE_JWKS_URL
};

export default config;
