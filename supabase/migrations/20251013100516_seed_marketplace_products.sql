-- Sample data for 'strategies' table
INSERT INTO public.strategies (title, description, content, is_paid, price)
VALUES
  ('Stratégie de Scalping "Momentum Pro"', 'Une stratégie de scalping à haute fréquence conçue pour les marchés en tendance. Idéale pour les traders actifs sur des timeframes de 1 à 5 minutes.', 'Contenu détaillé de la stratégie Momentum Pro...', TRUE, 99.00),
  ('Stratégie de Swing Trading "Zenith"', 'Approche de swing trading basée sur les niveaux de support/résistance majeurs et les modèles de chandeliers. Parfait pour les traders patients.', 'Contenu détaillé de la stratégie Zenith...', TRUE, 149.00);

-- Sample data for 'indicators' table
INSERT INTO public.indicators (name, description, file_url, compatibility, is_paid, price)
VALUES
  ('Indicateur "Smart Trend Line"', 'Trace automatiquement les lignes de tendance les plus pertinentes et alerte lors des cassures. Un gain de temps énorme.', '/indicators/smart_trend_line.ex4', ARRAY['MT4', 'MT5'], TRUE, 79.00),
  ('Oscillateur "Dynamic RSI"', 'Une version améliorée du RSI qui s''adapte à la volatilité du marché pour réduire les faux signaux.', '/indicators/dynamic_rsi.mq5', ARRAY['MT5'], TRUE, 59.00);
