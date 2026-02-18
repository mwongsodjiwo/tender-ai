-- Seed NUTS codes for the Netherlands (levels 0-3)

-- Level 0
INSERT INTO nuts_codes (code, label_nl, level, parent_code) VALUES
('NL', 'Nederland', 0, NULL);

-- Level 1
INSERT INTO nuts_codes (code, label_nl, level, parent_code) VALUES
('NL1', 'Noord-Nederland', 1, 'NL'),
('NL2', 'Oost-Nederland', 1, 'NL'),
('NL3', 'West-Nederland', 1, 'NL'),
('NL4', 'Zuid-Nederland', 1, 'NL');

-- Level 2
INSERT INTO nuts_codes (code, label_nl, level, parent_code) VALUES
('NL11', 'Groningen', 2, 'NL1'),
('NL12', 'Friesland', 2, 'NL1'),
('NL13', 'Drenthe', 2, 'NL1'),
('NL21', 'Overijssel', 2, 'NL2'),
('NL22', 'Gelderland', 2, 'NL2'),
('NL23', 'Flevoland', 2, 'NL2'),
('NL31', 'Utrecht', 2, 'NL3'),
('NL32', 'Noord-Holland', 2, 'NL3'),
('NL33', 'Zuid-Holland', 2, 'NL3'),
('NL34', 'Zeeland', 2, 'NL3'),
('NL41', 'Noord-Brabant', 2, 'NL4'),
('NL42', 'Limburg', 2, 'NL4');

-- Level 3
INSERT INTO nuts_codes (code, label_nl, level, parent_code) VALUES
('NL111', 'Oost-Groningen', 3, 'NL11'),
('NL112', 'Delfzijl en omgeving', 3, 'NL11'),
('NL113', 'Overig Groningen', 3, 'NL11'),
('NL124', 'Noord-Friesland', 3, 'NL12'),
('NL125', 'Zuidwest-Friesland', 3, 'NL12'),
('NL126', 'Zuidoost-Friesland', 3, 'NL12'),
('NL131', 'Noord-Drenthe', 3, 'NL13'),
('NL132', 'Zuidoost-Drenthe', 3, 'NL13'),
('NL133', 'Zuidwest-Drenthe', 3, 'NL13'),
('NL211', 'Noord-Overijssel', 3, 'NL21'),
('NL212', 'Zuidwest-Overijssel', 3, 'NL21'),
('NL213', 'Twente', 3, 'NL21'),
('NL221', 'Veluwe', 3, 'NL22'),
('NL224', 'Zuidwest-Gelderland', 3, 'NL22'),
('NL225', 'Achterhoek', 3, 'NL22'),
('NL226', 'Arnhem/Nijmegen', 3, 'NL22'),
('NL230', 'Flevoland', 3, 'NL23'),
('NL310', 'Utrecht', 3, 'NL31'),
('NL321', 'Kop van Noord-Holland', 3, 'NL32'),
('NL323', 'IJmond', 3, 'NL32'),
('NL324', 'Agglomeratie Haarlem', 3, 'NL32'),
('NL325', 'Zaanstreek', 3, 'NL32'),
('NL326', 'Groot-Amsterdam', 3, 'NL32'),
('NL327', 'Het Gooi en Vechtstreek', 3, 'NL32'),
('NL328', 'Alkmaar en omgeving', 3, 'NL32'),
('NL329', 'Agglom. ''s-Gravenhage', 3, 'NL33'),
('NL332', 'Agglomeratie Leiden en Bollenstreek', 3, 'NL33'),
('NL333', 'Delft en Westland', 3, 'NL33'),
('NL337', 'Agglomeratie ''s-Gravenhage', 3, 'NL33'),
('NL33A', 'Oost-Zuid-Holland', 3, 'NL33'),
('NL33B', 'Groot-Rijnmond', 3, 'NL33'),
('NL33C', 'Zuidoost-Zuid-Holland', 3, 'NL33'),
('NL341', 'Zeeuwsch-Vlaanderen', 3, 'NL34'),
('NL342', 'Overig Zeeland', 3, 'NL34'),
('NL411', 'West-Noord-Brabant', 3, 'NL41'),
('NL412', 'Midden-Noord-Brabant', 3, 'NL41'),
('NL413', 'Noordoost-Noord-Brabant', 3, 'NL41'),
('NL414', 'Zuidoost-Noord-Brabant', 3, 'NL41'),
('NL421', 'Noord-Limburg', 3, 'NL42'),
('NL422', 'Midden-Limburg', 3, 'NL42'),
('NL423', 'Zuid-Limburg', 3, 'NL42');
