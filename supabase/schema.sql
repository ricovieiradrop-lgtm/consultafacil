-- ============================================================
-- SCHEMA COMPLETO COM SUPABASE AUTH + RLS RIGOROSO
-- Sistema de agendamento médico com autenticação por telefone
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- Ligada ao auth.users do Supabase
-- Contém dados pessoais e sensíveis dos usuários
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient',
  location TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: specialties
-- Especialidades médicas (público)
-- ============================================================
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: doctors
-- Informações específicas dos médicos
-- ============================================================
CREATE TABLE doctors (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  crm TEXT NOT NULL UNIQUE,
  specialty_id UUID REFERENCES specialties(id),
  bio TEXT,
  rating DECIMAL(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: services
-- Procedimentos oferecidos pelos médicos
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: appointments
-- Consultas agendadas
-- ============================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_appointment UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- ============================================================
-- TABELA: doctor_availability
-- Disponibilidade de horários dos médicos
-- ============================================================
CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_doctors_active ON doctors(is_active);
CREATE INDEX idx_services_doctor ON services(doctor_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_availability_doctor ON doctor_availability(doctor_id);

-- ============================================================
-- FUNCTION: Atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Verificar role do usuário (CORRIGIDO - schema public)
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- FUNCTION: Criar profile automaticamente ao criar usuário
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, cpf, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- VIEWS: Queries otimizadas e seguras
-- ============================================================

CREATE OR REPLACE VIEW doctor_listings AS
SELECT 
  d.id,
  p.full_name,
  p.phone,
  p.avatar_url,
  p.location,
  p.city,
  p.state,
  d.crm,
  d.bio,
  d.rating,
  d.review_count,
  d.is_active,
  s.id as specialty_id,
  s.name as specialty,
  s.icon as specialty_icon
FROM doctors d
JOIN profiles p ON d.id = p.id
LEFT JOIN specialties s ON d.specialty_id = s.id
WHERE d.is_active = true AND p.role = 'doctor';

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
  dp.full_name as doctor_name,
  dp.avatar_url as doctor_avatar,
  doc.crm as doctor_crm,
  sp.name as doctor_specialty,
  a.patient_id,
  pp.full_name as patient_name,
  pp.phone as patient_phone,
  pp.avatar_url as patient_avatar,
  srv.id as service_id,
  srv.name as service_name,
  srv.description as service_description,
  srv.duration as service_duration
FROM appointments a
JOIN doctors d ON a.doctor_id = d.id
JOIN profiles dp ON d.id = dp.id
JOIN doctors doc ON d.id = doc.id
LEFT JOIN specialties sp ON doc.specialty_id = sp.id
JOIN profiles pp ON a.patient_id = pp.id
LEFT JOIN services srv ON a.service_id = srv.id;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: profiles
-- ============================================================

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Doctors can read their patients basic info"
  ON profiles FOR SELECT
  USING (
    role = 'patient' AND 
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.patient_id = profiles.id
      AND a.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  USING (public.user_role() = 'admin');

CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (public.user_role() = 'admin');

CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.user_role() = 'admin');

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- POLICIES: doctors
-- ============================================================

CREATE POLICY "Public can read active doctors"
  ON doctors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Doctors can update own profile"
  ON doctors FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can manage doctors"
  ON doctors FOR ALL
  USING (public.user_role() = 'admin');

-- ============================================================
-- POLICIES: services
-- ============================================================

CREATE POLICY "Public can read active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Doctors can manage own services"
  ON services FOR ALL
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Admin can manage all services"
  ON services FOR ALL
  USING (public.user_role() = 'admin');

-- ============================================================
-- POLICIES: appointments
-- ============================================================

CREATE POLICY "Patients can read own appointments"
  ON appointments FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors can read own appointments"
  ON appointments FOR SELECT
  USING (doctor_id = auth.uid());

CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    patient_id = auth.uid() AND
    public.user_role() = 'patient'
  );

CREATE POLICY "Patients can cancel own appointments"
  ON appointments FOR UPDATE
  USING (patient_id = auth.uid() AND status = 'scheduled')
  WITH CHECK (patient_id = auth.uid() AND status = 'cancelled');

CREATE POLICY "Doctors can update own appointments status"
  ON appointments FOR UPDATE
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Admin can manage all appointments"
  ON appointments FOR ALL
  USING (public.user_role() = 'admin');

-- ============================================================
-- POLICIES: doctor_availability
-- ============================================================

CREATE POLICY "Public can read active availability"
  ON doctor_availability FOR SELECT
  USING (is_active = true);

CREATE POLICY "Doctors can manage own availability"
  ON doctor_availability FOR ALL
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Admin can manage all availability"
  ON doctor_availability FOR ALL
  USING (public.user_role() = 'admin');

-- ============================================================
-- POLICIES: specialties
-- ============================================================

CREATE POLICY "Public can read specialties"
  ON specialties FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage specialties"
  ON specialties FOR ALL
  USING (public.user_role() = 'admin');

-- ============================================================
-- DADOS INICIAIS: Especialidades
-- ============================================================
INSERT INTO specialties (name, icon) VALUES
  ('Cardiologia', 'heart'),
  ('Dermatologia', 'sparkles'),
  ('Ortopedia', 'bone'),
  ('Pediatria', 'baby'),
  ('Neurologia', 'brain'),
  ('Oftalmologia', 'eye')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- FUNCTION SEGURA: Obter dados do paciente sem CPF
-- ============================================================
CREATE OR REPLACE FUNCTION get_patient_safe_info(patient_uuid UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT
) AS $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.doctor_id = auth.uid()
    AND a.patient_id = patient_uuid
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.phone, p.avatar_url
  FROM profiles p
  WHERE p.id = patient_uuid;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Admin cadastra médico (invitação)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_invite_doctor(
  p_phone TEXT,
  p_name TEXT
)
RETURNS UUID AS $
DECLARE
  v_user_id UUID;
  v_existing_user UUID;
BEGIN
  IF public.user_role() != 'admin' THEN
    RAISE EXCEPTION 'Apenas admins podem convidar médicos';
  END IF;

  SELECT id INTO v_existing_user
  FROM auth.users
  WHERE phone = p_phone;

  IF v_existing_user IS NOT NULL THEN
    SELECT id INTO v_existing_user
    FROM profiles
    WHERE phone = p_phone;
    
    IF v_existing_user IS NOT NULL THEN
      RAISE EXCEPTION 'Este telefone já está cadastrado no sistema';
    END IF;
  END IF;

  INSERT INTO profiles (id, full_name, phone, cpf, role)
  VALUES (
    uuid_generate_v4(),
    p_name,
    p_phone,
    'PENDENTE',
    'doctor'
  )
  RETURNING id INTO v_user_id;

  INSERT INTO doctors (id, crm, bio, is_active)
  VALUES (v_user_id, 'PENDENTE', '', true);

  RETURN v_user_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Este telefone já está cadastrado no sistema';
  WHEN OTHERS THEN
    RAISE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
