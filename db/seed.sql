-- Overtaxed — mock seed for building/testing queries before real ingestion.
-- A single Chicago block (N Racine Ave) engineered so that:
--   • the SUBJECT (P001) is over-assessed vs comparable sales, and
--   • cheaper homes carry HIGHER assessment ratios than expensive ones
--     (regressivity → PRD > 1.03), mirroring the real Cook County story.
-- Plus a small London (SW11) set for the UK council-tax-band demo.

-- ── US: Cook County (assessments = assessor value, sales = actual price) ──
INSERT INTO overtaxed.assessments (region, pin, tax_year, assessed_value, lat, lng, class, address) VALUES
('Cook County','P001',2024,620000,41.9400,-87.6590,'203','3212 N Racine Ave, Chicago IL'),
('Cook County','P002',2024,372000,41.9406,-87.6590,'203','3210 N Racine Ave, Chicago IL'),
('Cook County','P003',2024,360000,41.9412,-87.6590,'203','3208 N Racine Ave, Chicago IL'),
('Cook County','P004',2024,590000,41.9394,-87.6590,'203','3214 N Racine Ave, Chicago IL'),
('Cook County','P005',2024,780000,41.9388,-87.6590,'203','3216 N Racine Ave, Chicago IL'),
('Cook County','P006',2024,760000,41.9382,-87.6590,'203','3218 N Racine Ave, Chicago IL'),
('Cook County','P007',2024,384000,41.9418,-87.6590,'203','3206 N Racine Ave, Chicago IL'),
('Cook County','P008',2024,660000,41.9424,-87.6590,'203','3204 N Racine Ave, Chicago IL'),
('Cook County','P009',2024,800000,41.9376,-87.6590,'203','3220 N Racine Ave, Chicago IL'),
('Cook County','P010',2024,351000,41.9430,-87.6590,'203','3202 N Racine Ave, Chicago IL'),
('Cook County','P011',2024,545000,41.9370,-87.6590,'203','3222 N Racine Ave, Chicago IL'),
('Cook County','P012',2024,405000,41.9436,-87.6590,'203','3200 N Racine Ave, Chicago IL'),
('Cook County','P013',2024,690000,41.9364,-87.6590,'203','3224 N Racine Ave, Chicago IL'),
('Cook County','P014',2024,655000,41.9358,-87.6590,'203','3226 N Racine Ave, Chicago IL');

INSERT INTO overtaxed.sales (country, region, txn_id, pin, address, postcode, sale_date, sale_price, lat, lng, prop_type, beds) VALUES
('US','Cook County','S001','P001','3212 N Racine Ave, Chicago IL','60657','2023-08-14',520000,41.9400,-87.6590,'single',3),
('US','Cook County','S002','P002','3210 N Racine Ave, Chicago IL','60657','2023-06-02',305000,41.9406,-87.6590,'single',2),
('US','Cook County','S003','P003','3208 N Racine Ave, Chicago IL','60657','2024-01-20',298000,41.9412,-87.6590,'single',2),
('US','Cook County','S004','P004','3214 N Racine Ave, Chicago IL','60657','2023-11-09',540000,41.9394,-87.6590,'single',3),
('US','Cook County','S005','P005','3216 N Racine Ave, Chicago IL','60657','2023-09-27',910000,41.9388,-87.6590,'single',4),
('US','Cook County','S006','P006','3218 N Racine Ave, Chicago IL','60657','2024-03-15',875000,41.9382,-87.6590,'single',4),
('US','Cook County','S007','P007','3206 N Racine Ave, Chicago IL','60657','2023-07-30',320000,41.9418,-87.6590,'single',2),
('US','Cook County','S008','P008','3204 N Racine Ave, Chicago IL','60657','2023-10-11',610000,41.9424,-87.6590,'single',3),
('US','Cook County','S009','P009','3220 N Racine Ave, Chicago IL','60657','2024-02-06',950000,41.9376,-87.6590,'single',4),
('US','Cook County','S010','P010','3202 N Racine Ave, Chicago IL','60657','2023-05-19',285000,41.9430,-87.6590,'single',2),
('US','Cook County','S011','P011','3222 N Racine Ave, Chicago IL','60657','2023-12-01',500000,41.9370,-87.6590,'single',3),
('US','Cook County','S012','P012','3200 N Racine Ave, Chicago IL','60657','2024-04-22',340000,41.9436,-87.6590,'single',2),
('US','Cook County','S013','P013','3224 N Racine Ave, Chicago IL','60657','2023-08-08',720000,41.9364,-87.6590,'single',4),
('US','Cook County','S014','P014','3226 N Racine Ave, Chicago IL','60657','2024-01-14',680000,41.9358,-87.6590,'single',3);

-- ── UK: England council-tax band thresholds (1991 values) ──
INSERT INTO overtaxed.band_thresholds (band, min_1991, max_1991) VALUES
('A',0,40000),('B',40001,52000),('C',52001,68000),('D',68001,88000),
('E',88001,120000),('F',120001,160000),('G',160001,320000),('H',320001,4294967295);

-- ── UK: a Battersea (SW11) terrace — subject in band E, neighbours in D ──
INSERT INTO overtaxed.sales (country, region, txn_id, pin, address, postcode, sale_date, sale_price, lat, lng, prop_type, beds) VALUES
('UK','Greater London','U001','','12 Lavender Sweep, London','SW11 1DX','2023-07-04',655000,51.4635,-0.1665,'terraced',3),
('UK','Greater London','U002','','14 Lavender Sweep, London','SW11 1DX','2023-05-21',640000,51.4637,-0.1666,'terraced',3),
('UK','Greater London','U003','','10 Lavender Sweep, London','SW11 1DX','2024-02-18',648000,51.4633,-0.1664,'terraced',3),
('UK','Greater London','U004','','16 Lavender Sweep, London','SW11 1DX','2023-11-30',662000,51.4639,-0.1667,'terraced',3),
('UK','Greater London','U005','','8 Lavender Sweep, London','SW11 1DX','2023-09-12',635000,51.4631,-0.1663,'terraced',3);

INSERT INTO overtaxed.uk_bands (postcode, address, band, lat, lng) VALUES
('SW11 1DX','12 Lavender Sweep, London','E',51.4635,-0.1665),
('SW11 1DX','14 Lavender Sweep, London','D',51.4637,-0.1666),
('SW11 1DX','10 Lavender Sweep, London','D',51.4633,-0.1664),
('SW11 1DX','16 Lavender Sweep, London','D',51.4639,-0.1667),
('SW11 1DX','8 Lavender Sweep, London','D',51.4631,-0.1663);
