-- Создание таблиц для catalog_schema
CREATE TABLE IF NOT EXISTS catalog_schema.service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS catalog_schema.service_subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES catalog_schema.service_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS catalog_schema.master_services (
    id SERIAL PRIMARY KEY,
    master_id INTEGER NOT NULL REFERENCES user_schema.masters(id) ON DELETE CASCADE,
    salon_id INTEGER REFERENCES user_schema.salons(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES catalog_schema.service_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Создание таблиц для user_schema (мастерские таблицы)
CREATE TABLE IF NOT EXISTS user_schema.master_skills (
    id SERIAL PRIMARY KEY,
    master_id INTEGER NOT NULL REFERENCES user_schema.masters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_schema.master_portfolio (
    id SERIAL PRIMARY KEY,
    master_id INTEGER NOT NULL REFERENCES user_schema.masters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category VARCHAR(100),
    service_type VARCHAR(255),
    is_featured BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    likes_count INTEGER DEFAULT 0,
    created_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Индексы для catalog_schema
CREATE INDEX IF NOT EXISTS service_categories_is_active_idx ON catalog_schema.service_categories(is_active);
CREATE INDEX IF NOT EXISTS service_categories_is_popular_idx ON catalog_schema.service_categories(is_popular);
CREATE INDEX IF NOT EXISTS service_subcategories_category_id_idx ON catalog_schema.service_subcategories(category_id);
CREATE INDEX IF NOT EXISTS master_services_master_id_idx ON catalog_schema.master_services(master_id);
CREATE INDEX IF NOT EXISTS master_services_salon_id_idx ON catalog_schema.master_services(salon_id);
CREATE INDEX IF NOT EXISTS master_services_category_id_idx ON catalog_schema.master_services(category_id);
CREATE INDEX IF NOT EXISTS master_services_is_active_idx ON catalog_schema.master_services(is_active);

-- Индексы для user_schema
CREATE INDEX IF NOT EXISTS master_skills_master_id_idx ON user_schema.master_skills(master_id);
CREATE INDEX IF NOT EXISTS master_skills_is_active_idx ON user_schema.master_skills(is_active);
CREATE INDEX IF NOT EXISTS master_portfolio_master_id_idx ON user_schema.master_portfolio(master_id);
CREATE INDEX IF NOT EXISTS master_portfolio_category_idx ON user_schema.master_portfolio(category);
CREATE INDEX IF NOT EXISTS master_portfolio_is_featured_idx ON user_schema.master_portfolio(is_featured);
CREATE INDEX IF NOT EXISTS master_portfolio_is_visible_idx ON user_schema.master_portfolio(is_visible);

-- Создание таблиц для booking_schema
CREATE TABLE IF NOT EXISTS booking_schema.master_availability (
    id SERIAL PRIMARY KEY,
    master_id INTEGER NOT NULL REFERENCES user_schema.masters(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES catalog_schema.master_services(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 60,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE booking_schema.enum_slots_status AS ENUM ('free', 'booked', 'blocked');
CREATE TYPE booking_schema.enum_slots_source AS ENUM ('auto', 'manual');

CREATE TABLE IF NOT EXISTS booking_schema.slots (
    id SERIAL PRIMARY KEY,
    master_id INTEGER NOT NULL REFERENCES user_schema.masters(id) ON DELETE CASCADE ON UPDATE CASCADE,
    service_id INTEGER REFERENCES catalog_schema.master_services(id) ON DELETE SET NULL ON UPDATE CASCADE,
    master_availability_id INTEGER REFERENCES booking_schema.master_availability(id) ON DELETE SET NULL ON UPDATE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_schema.enum_slots_status DEFAULT 'free',
    source booking_schema.enum_slots_source DEFAULT 'auto',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS booking_schema.bookings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES user_schema.clients(id) ON DELETE CASCADE,
    master_id INTEGER REFERENCES user_schema.masters(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES catalog_schema.master_services(id) ON DELETE SET NULL,
    salon_id INTEGER REFERENCES user_schema.salons(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_reason TEXT
);

-- Индексы для booking_schema
CREATE INDEX IF NOT EXISTS master_availability_master_id_idx ON booking_schema.master_availability(master_id);
CREATE INDEX IF NOT EXISTS master_availability_date_idx ON booking_schema.master_availability(date);
CREATE INDEX IF NOT EXISTS master_availability_master_service_date_idx ON booking_schema.master_availability(master_id, service_id, date);
CREATE INDEX IF NOT EXISTS master_availability_is_available_idx ON booking_schema.master_availability(is_available);

CREATE INDEX IF NOT EXISTS slots_master_id_idx ON booking_schema.slots(master_id);
CREATE INDEX IF NOT EXISTS slots_service_id_idx ON booking_schema.slots(service_id);
CREATE INDEX IF NOT EXISTS slots_master_availability_id_idx ON booking_schema.slots(master_availability_id);
CREATE INDEX IF NOT EXISTS slots_master_datetime_idx ON booking_schema.slots(master_id, start_time);
CREATE INDEX IF NOT EXISTS slots_master_service_datetime_idx ON booking_schema.slots(master_id, service_id, start_time);
CREATE INDEX IF NOT EXISTS slots_status_idx ON booking_schema.slots(status);
CREATE INDEX IF NOT EXISTS slots_master_status_idx ON booking_schema.slots(master_id, status);

CREATE INDEX IF NOT EXISTS bookings_client_id_idx ON booking_schema.bookings(client_id);
CREATE INDEX IF NOT EXISTS bookings_master_id_idx ON booking_schema.bookings(master_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON booking_schema.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_start_time_idx ON booking_schema.bookings(start_time);

-- Предоставление прав
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA catalog_schema TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA booking_schema TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA catalog_schema TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA booking_schema TO postgres;

DO $$
BEGIN
    RAISE NOTICE 'Таблицы для catalog_schema и booking_schema успешно созданы';
END $$;
