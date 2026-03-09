-- Сброс всех последовательностей (sequences) для таблиц
-- Выполнять ПОСЛЕ TRUNCATE таблиц
-- setval(seq, 1, true) означает что следующий nextval() вернёт 1

-- user_schema
SELECT setval('user_schema.users_id_seq', 1, true);
SELECT setval('user_schema.clients_id_seq', 1, true);
SELECT setval('user_schema.masters_id_seq', 1, true);
SELECT setval('user_schema.salons_id_seq', 1, true);
SELECT setval('user_schema.admins_id_seq', 1, true);
SELECT setval('user_schema.master_skills_id_seq', 1, true);
SELECT setval('user_schema.master_portfolio_id_seq', 1, true);
SELECT setval('user_schema.salon_locations_id_seq', 1, true);
SELECT setval('user_schema.favorites_id_seq', 1, true);
SELECT setval('user_schema.reviews_id_seq', 1, true);

-- catalog_schema
SELECT setval('catalog_schema.service_categories_id_seq', 1, true);
SELECT setval('catalog_schema.master_services_id_seq', 1, true);

-- booking_schema
SELECT setval('booking_schema.master_availability_id_seq', 1, true);
SELECT setval('booking_schema.slots_id_seq', 1, true);
SELECT setval('booking_schema.booking_id_seq', 1, true);
