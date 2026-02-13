insert into campuses (name, city, country, is_active) values
('University of Ghana (Legon)', 'Accra', 'Ghana', true),
('KNUST', 'Kumasi', 'Ghana', true),
('University of Cape Coast (UCC)', 'Cape Coast', 'Ghana', true),
('University of Education, Winneba (UEW)', 'Winneba', 'Ghana', true),
('UPSA', 'Accra', 'Ghana', true),
('Ashesi University', 'Berekuso', 'Ghana', true),
('GIMPA', 'Accra', 'Ghana', true),
('University of Professional Studies, Kumasi (UPSK)', 'Kumasi', 'Ghana', true)
on conflict (name, city, country) do nothing;
