// Mock environment variables — runs BEFORE framework via setupFiles
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.STRIPE_PRICE_MONTHLY = 'price_monthly_test';
process.env.STRIPE_PRICE_YEARLY = 'price_yearly_test';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.VAPID_PUBLIC_KEY = 'test-vapid-public';
process.env.VAPID_PRIVATE_KEY = 'test-vapid-private';
