-- Migration 35: nouveau type de notification pour le rappel du jour de séance.
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'session_reminder';
