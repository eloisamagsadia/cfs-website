-- Run this in Supabase SQL Editor to make yourself admin
-- Replace the email with YOUR email
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@gmail.com'
);

-- Verify
SELECT id, display_name, role FROM profiles WHERE role = 'admin';
