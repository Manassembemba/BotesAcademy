-- La colonne proof_url est NOT NULL mais les inscriptions manuelles admin
-- n'ont pas de fichier de preuve. On la rend nullable.
ALTER TABLE public.payment_proofs 
  ALTER COLUMN proof_url DROP NOT NULL;
