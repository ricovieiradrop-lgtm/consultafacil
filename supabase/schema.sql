-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (pacientes, médicos, admin)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('patient', 'doctor', 'admin')),
  location TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Specialties table
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors table (informações específicas dos médicos)
CREATE TABLE doctors (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  crm TEXT NOT NULL UNIQUE,
  specialty_id UUID REFERENCES specialties(id),
  bio TEXT,
  rating DECIMAL(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services/Procedures table (serviços oferecidos pelos médicos)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- em minutos
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table (consultas agendadas)
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor availability table (disponibilidade dos médicos)
CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = domingo, 6 = sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_services_doctor ON services(doctor_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_availability_doctor ON doctor_availability(doctor_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default specialties
INSERT INTO specialties (name, icon) VALUES
  ('Cardiologia', 'heart'),
  ('Dermatologia', 'sparkles'),
  ('Ortopedia', 'bone'),
  ('Pediatria', 'baby'),
  ('Neurologia', 'brain'),
  ('Oftalmologia', 'eye');

-- Create a view for doctor listings with all related info
CREATE OR REPLACE VIEW doctor_listings AS
SELECT 
  d.id,
  u.name,
  u.email,
  u.phone,
  u.avatar,
  u.location,
  u.city,
  u.state,
  d.crm,
  d.bio,
  d.rating,
  d.review_count,
  s.id as specialty_id,
  s.name as specialty,
  s.icon as specialty_icon
FROM doctors d
JOIN users u ON d.id = u.id
LEFT JOIN specialties s ON d.specialty_id = s.id
WHERE u.user_type = 'doctor';

-- Create a view for appointments with doctor and patient info
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.price,
  a.notes,
  a.created_at,
  d.id as doctor_id,
  du.name as doctor_name,
  du.avatar as doctor_avatar,
  doc.crm as doctor_crm,
  sp.name as doctor_specialty,
  p.id as patient_id,
  pu.name as patient_name,
  pu.email as patient_email,
  pu.phone as patient_phone,
  pu.avatar as patient_avatar,
  srv.id as service_id,
  srv.name as service_name,
  srv.description as service_description,
  srv.duration as service_duration
FROM appointments a
JOIN doctors d ON a.doctor_id = d.id
JOIN users du ON d.id = du.id
JOIN doctors doc ON d.id = doc.id
LEFT JOIN specialties sp ON doc.specialty_id = sp.id
JOIN users pu ON a.patient_id = pu.id
LEFT JOIN users p ON a.patient_id = p.id
LEFT JOIN services srv ON a.service_id = srv.id;

-- Enable Row Level Security (RLS) - preparado para quando adicionar auth
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

-- Policies públicas temporárias (para desenvolvimento sem auth)
-- Você pode ajustar essas policies depois quando implementar autenticação

CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to users" ON users FOR DELETE USING (true);

CREATE POLICY "Allow public read access to doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to doctors" ON doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to doctors" ON doctors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to doctors" ON doctors FOR DELETE USING (true);

CREATE POLICY "Allow public read access to services" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to services" ON services FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to services" ON services FOR DELETE USING (true);

CREATE POLICY "Allow public read access to appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to appointments" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to appointments" ON appointments FOR DELETE USING (true);

CREATE POLICY "Allow public read access to availability" ON doctor_availability FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to availability" ON doctor_availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to availability" ON doctor_availability FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to availability" ON doctor_availability FOR DELETE USING (true);
