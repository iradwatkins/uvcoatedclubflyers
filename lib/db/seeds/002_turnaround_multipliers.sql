-- Seed Data Part 2: Turnaround Multipliers
-- 224 records: 7 paper stocks × 8 quantities × 4 turnaround categories
-- Multipliers control pricing based on quantity and turnaround speed

-- Clear existing multipliers
DELETE FROM turnaround_multipliers;

-- ========================================
-- TURNAROUND MULTIPLIERS
-- Format: (paper_stock_id, quantity, turnaround_category, multiplier)
-- ========================================

-- 9PT C2S CARDSTOCK (ID: 1) - Complete data from documentation
INSERT INTO turnaround_multipliers (paper_stock_id, quantity, turnaround_category, multiplier) VALUES
-- Economy turnarounds (2-7 days)
(1, 25, 'economy', 14.10),
(1, 50, 'economy', 8.35),
(1, 100, 'economy', 5.22),
(1, 250, 'economy', 3.49),
(1, 500, 'economy', 2.37),
(1, 1000, 'economy', 1.34),
(1, 2500, 'economy', 0.89),
(1, 5000, 'economy', 0.72),

-- Fast turnarounds (1-3 days)
(1, 25, 'fast', 16.70),
(1, 50, 'fast', 9.39),
(1, 100, 'fast', 5.87),
(1, 250, 'fast', 3.80),
(1, 500, 'fast', 3.64),
(1, 1000, 'fast', 1.92),
(1, 2500, 'fast', 1.11),
(1, 5000, 'fast', 0.84),

-- Faster turnarounds (Next Day)
(1, 25, 'faster', 21.80),
(1, 50, 'faster', 12.62),
(1, 100, 'faster', 8.17),
(1, 250, 'faster', 5.32),
(1, 500, 'faster', 5.44),
(1, 1000, 'faster', 2.84),
(1, 2500, 'faster', 1.65),
(1, 5000, 'faster', 1.25),

-- Crazy Fast (Same Day)
(1, 25, 'crazy_fast', 152.93),
(1, 50, 'crazy_fast', 93.67),
(1, 100, 'crazy_fast', 50.45),
(1, 250, 'crazy_fast', 24.05),
(1, 500, 'crazy_fast', 15.42),
(1, 1000, 'crazy_fast', 11.09),
(1, 2500, 'crazy_fast', 8.45),
(1, 5000, 'crazy_fast', 7.74);

-- 16PT C2S CARDSTOCK (ID: 2) - Premium cardstock multipliers
INSERT INTO turnaround_multipliers (paper_stock_id, quantity, turnaround_category, multiplier) VALUES
-- Economy
(2, 25, 'economy', 18.50),
(2, 50, 'economy', 11.20),
(2, 100, 'economy', 6.85),
(2, 250, 'economy', 4.50),
(2, 500, 'economy', 3.10),
(2, 1000, 'economy', 1.75),
(2, 2500, 'economy', 1.15),
(2, 5000, 'economy', 0.95),

-- Fast
(2, 25, 'fast', 22.00),
(2, 50, 'fast', 12.50),
(2, 100, 'fast', 7.75),
(2, 250, 'fast', 5.00),
(2, 500, 'fast', 4.75),
(2, 1000, 'fast', 2.50),
(2, 2500, 'fast', 1.45),
(2, 5000, 'fast', 1.10),

-- Faster
(2, 25, 'faster', 28.50),
(2, 50, 'faster', 16.50),
(2, 100, 'faster', 10.75),
(2, 250, 'faster', 7.00),
(2, 500, 'faster', 7.15),
(2, 1000, 'faster', 3.75),
(2, 2500, 'faster', 2.15),
(2, 5000, 'faster', 1.65),

-- Crazy Fast
(2, 25, 'crazy_fast', 195.00),
(2, 50, 'crazy_fast', 120.00),
(2, 100, 'crazy_fast', 65.00),
(2, 250, 'crazy_fast', 31.00),
(2, 500, 'crazy_fast', 20.00),
(2, 1000, 'crazy_fast', 14.50),
(2, 2500, 'crazy_fast', 11.00),
(2, 5000, 'crazy_fast', 10.00);

-- 60 LB OFFSET (ID: 3) - Economical text paper
INSERT INTO turnaround_multipliers (paper_stock_id, quantity, turnaround_category, multiplier) VALUES
-- Economy
(3, 25, 'economy', 11.25),
(3, 50, 'economy', 6.70),
(3, 100, 'economy', 4.18),
(3, 250, 'economy', 2.79),
(3, 500, 'economy', 1.90),
(3, 1000, 'economy', 1.07),
(3, 2500, 'economy', 0.71),
(3, 5000, 'economy', 0.58),

-- Fast
(3, 25, 'fast', 13.36),
(3, 50, 'fast', 7.51),
(3, 100, 'fast', 4.70),
(3, 250, 'fast', 3.04),
(3, 500, 'fast', 2.91),
(3, 1000, 'fast', 1.54),
(3, 2500, 'fast', 0.89),
(3, 5000, 'fast', 0.67),

-- Faster
(3, 25, 'faster', 17.44),
(3, 50, 'faster', 10.10),
(3, 100, 'faster', 6.54),
(3, 250, 'faster', 4.26),
(3, 500, 'faster', 4.35),
(3, 1000, 'faster', 2.27),
(3, 2500, 'faster', 1.32),
(3, 5000, 'faster', 1.00),

-- Crazy Fast
(3, 25, 'crazy_fast', 122.34),
(3, 50, 'crazy_fast', 74.94),
(3, 100, 'crazy_fast', 40.36),
(3, 250, 'crazy_fast', 19.24),
(3, 500, 'crazy_fast', 12.34),
(3, 1000, 'crazy_fast', 8.87),
(3, 2500, 'crazy_fast', 6.76),
(3, 5000, 'crazy_fast', 6.19);

-- 100 LB GLOSS TEXT (ID: 4) - Heavy text weight
INSERT INTO turnaround_multipliers (paper_stock_id, quantity, turnaround_category, multiplier) VALUES
-- Economy
(4, 25, 'economy', 14.10),
(4, 50, 'economy', 8.35),
(4, 100, 'economy', 5.22),
(4, 250, 'economy', 3.49),
(4, 500, 'economy', 2.37),
(4, 1000, 'economy', 1.34),
(4, 2500, 'economy', 0.89),
(4, 5000, 'economy', 0.72),

-- Fast
(4, 25, 'fast', 16.70),
(4, 50, 'fast', 9.39),
(4, 100, 'fast', 5.87),
(4, 250, 'fast', 3.80),
(4, 500, 'fast', 3.64),
(4, 1000, 'fast', 1.92),
(4, 2500, 'fast', 1.11),
(4, 5000, 'fast', 0.84),

-- Faster
(4, 25, 'faster', 21.80),
(4, 50, 'faster', 12.62),
(4, 100, 'faster', 8.17),
(4, 250, 'faster', 5.32),
(4, 500, 'faster', 5.44),
(4, 1000, 'faster', 2.84),
(4, 2500, 'faster', 1.65),
(4, 5000, 'faster', 1.25),

-- Crazy Fast
(4, 25, 'crazy_fast', 152.93),
(4, 50, 'crazy_fast', 93.67),
(4, 100, 'crazy_fast', 50.45),
(4, 250, 'crazy_fast', 24.05),
(4, 500, 'crazy_fast', 15.42),
(4, 1000, 'crazy_fast', 11.09),
(4, 2500, 'crazy_fast', 8.45),
(4, 5000, 'crazy_fast', 7.74);

-- 12PT C2S CARDSTOCK (ID: 5) - Uses 9pt pricing base
INSERT INTO turnaround_multipliers (paper_stock_id, quantity, turnaround_category, multiplier) VALUES
-- Economy (same as 9pt since it uses 9pt pricing)
(5, 25, 'economy', 14.10),
(5, 50, 'economy', 8.35),
(5, 100, 'economy', 5.22),
(5, 250, 'economy', 3.49),
(5, 500, 'economy', 2.37),
(5, 1000, 'economy', 1.34),
(5, 2500, 'economy', 0.89),
(5, 5000, 'economy', 0.72),

-- Fast
(5, 25, 'fast', 16.70),
(5, 50, 'fast', 9.39),
(5, 100, 'fast', 5.87),
(5, 250, 'fast', 3.80),
(5, 500, 'fast', 3.64),
(5, 1000, 'fast', 1.92),
(5, 2500, 'fast', 1.11),
(5, 5000, 'fast', 0.84),

-- Faster
(5, 25, 'faster', 21.80),
(5, 50, 'faster', 12.62),
(5, 100, 'faster', 8.17),
(5, 250, 'faster', 5.32),
(5, 500, 'faster', 5.44),
(5, 1000, 'faster', 2.84),
(5, 2500, 'faster', 1.65),
(5, 5000, 'faster', 1.25),

-- Crazy Fast
(5, 25, 'crazy_fast', 152.93),
(5, 50, 'crazy_fast', 93.67),
(5, 100, 'crazy_fast', 50.45),
(5, 250, 'crazy_fast', 24.05),
(5, 500, 'crazy_fast', 15.42),
(5, 1000, 'crazy_fast', 11.09),
(5, 2500, 'crazy_fast', 8.45),
(5, 5000, 'crazy_fast', 7.74);

-- 100 LB UNCOATED COVER (ID: 6) - Natural uncoated stock
INSERT INTO turnaround_multipliers (paper_stock_id, quantity, turnaround_category, multiplier) VALUES
-- Economy
(6, 25, 'economy', 16.25),
(6, 50, 'economy', 9.85),
(6, 100, 'economy', 6.15),
(6, 250, 'economy', 4.10),
(6, 500, 'economy', 2.79),
(6, 1000, 'economy', 1.58),
(6, 2500, 'economy', 1.05),
(6, 5000, 'economy', 0.85),

-- Fast
(6, 25, 'fast', 19.65),
(6, 50, 'fast', 11.05),
(6, 100, 'fast', 6.90),
(6, 250, 'fast', 4.47),
(6, 500, 'fast', 4.28),
(6, 1000, 'fast', 2.26),
(6, 2500, 'fast', 1.31),
(6, 5000, 'fast', 0.99),

-- Faster
(6, 25, 'faster', 25.65),
(6, 50, 'faster', 14.85),
(6, 100, 'faster', 9.61),
(6, 250, 'faster', 6.26),
(6, 500, 'faster', 6.40),
(6, 1000, 'faster', 3.34),
(6, 2500, 'faster', 1.94),
(6, 5000, 'faster', 1.47),

-- Crazy Fast
(6, 25, 'crazy_fast', 179.95),
(6, 50, 'crazy_fast', 110.20),
(6, 100, 'crazy_fast', 59.35),
(6, 250, 'crazy_fast', 28.30),
(6, 500, 'crazy_fast', 18.15),
(6, 1000, 'crazy_fast', 13.05),
(6, 2500, 'crazy_fast', 9.95),
(6, 5000, 'crazy_fast', 9.10);

-- 14PT C2S CARDSTOCK (ID: 7) - Uses 16pt pricing base
INSERT INTO turnaround_multipliers (paper_stock_id, quantity, turnaround_category, multiplier) VALUES
-- Economy (same as 16pt since it uses 16pt pricing)
(7, 25, 'economy', 18.50),
(7, 50, 'economy', 11.20),
(7, 100, 'economy', 6.85),
(7, 250, 'economy', 4.50),
(7, 500, 'economy', 3.10),
(7, 1000, 'economy', 1.75),
(7, 2500, 'economy', 1.15),
(7, 5000, 'economy', 0.95),

-- Fast
(7, 25, 'fast', 22.00),
(7, 50, 'fast', 12.50),
(7, 100, 'fast', 7.75),
(7, 250, 'fast', 5.00),
(7, 500, 'fast', 4.75),
(7, 1000, 'fast', 2.50),
(7, 2500, 'fast', 1.45),
(7, 5000, 'fast', 1.10),

-- Faster
(7, 25, 'faster', 28.50),
(7, 50, 'faster', 16.50),
(7, 100, 'faster', 10.75),
(7, 250, 'faster', 7.00),
(7, 500, 'faster', 7.15),
(7, 1000, 'faster', 3.75),
(7, 2500, 'faster', 2.15),
(7, 5000, 'faster', 1.65),

-- Crazy Fast
(7, 25, 'crazy_fast', 195.00),
(7, 50, 'crazy_fast', 120.00),
(7, 100, 'crazy_fast', 65.00),
(7, 250, 'crazy_fast', 31.00),
(7, 500, 'crazy_fast', 20.00),
(7, 1000, 'crazy_fast', 14.50),
(7, 2500, 'crazy_fast', 11.00),
(7, 5000, 'crazy_fast', 10.00);

-- Verify counts
DO $$
DECLARE
  total_count INTEGER;
  expected_count INTEGER := 224; -- 7 papers × 8 quantities × 4 categories
BEGIN
  SELECT COUNT(*) INTO total_count FROM turnaround_multipliers;

  IF total_count = expected_count THEN
    RAISE NOTICE 'SUCCESS: Seeded % turnaround multipliers (7 papers × 8 quantities × 4 categories)', total_count;
  ELSE
    RAISE WARNING 'Expected % multipliers but found %', expected_count, total_count;
  END IF;
END $$;
