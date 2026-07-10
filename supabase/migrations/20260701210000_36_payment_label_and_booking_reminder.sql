-- Migration 36: paiement libre (libellé) + dédup rappel du jour de séance.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS label text;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
