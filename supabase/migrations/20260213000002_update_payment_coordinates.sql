-- Mise à jour des coordonnées de paiement pour supporter le multi-comptes
UPDATE site_settings 
SET value = '{
  "mobile_money": [
    {"name": "M-Pesa", "number": "+243 810 000 000", "operator": "vodacom"},
    {"name": "Orange Money", "number": "+243 890 000 000", "operator": "orange"},
    {"name": "Airtel Money", "number": "+243 970 000 000", "operator": "airtel"}
  ],
  "bank_transfer": [
    {"name": "Equity BCDC", "details": "RIB: 00000-00000-12345678901-00", "account_name": "Nguma Academy"},
    {"name": "Rawbank", "details": "Compte: 12345-67890", "account_name": "Nguma Academy"}
  ],
  "cash_deposit": [
    {"name": "Bureau Kinshasa", "details": "Gombe, Avenue de l''Equateur n°12"}
  ]
}'::jsonb
WHERE key = 'payment_methods';
