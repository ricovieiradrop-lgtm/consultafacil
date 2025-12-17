-- Use this script to clean up dummy data from your database.
-- Run this in your Supabase SQL Editor.

-- Delete all appointments
DELETE FROM appointments;

-- Delete all services
DELETE FROM services;

-- Delete all doctors (this will cascade to availability, etc. if set up correctly, but let's be safe)
DELETE FROM doctor_availability;
DELETE FROM doctors;

-- Delete all profiles except potential admin if you want to keep it, but here we wipe all.
-- Be careful: this deletes ALL users' profiles.
-- If you want to keep your own user, you might want to filter by ID.
DELETE FROM profiles WHERE role != 'admin';
