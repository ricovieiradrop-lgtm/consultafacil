import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/* ============================================================
   TIPOS
============================================================ */

export type Specialty = {
  id: string;
  name: string;
  icon: string;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
};

export type Doctor = {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  specialtyId: string;
  crm: string;
  rating: number;
  reviewCount: number;
  location: string;
  city: string;
  state: string;
  bio: string;
  services: Service[];
};

/* ============================================================
   ESPECIALIDADES
============================================================ */

export function useSpecialties() {
  const [data, setData] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('specialties')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) setData(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

/* ============================================================
   MÉDICOS (COM SERVICES — PARTE CRÍTICA)
============================================================ */

export function useDoctors() {
  const [data, setData] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase
        .from('doctor_listings')
        .select(`
          id,
          full_name,
          avatar_url,
          crm,
          rating,
          review_count,
          location,
          city,
          state,
          bio,
          specialty_id,
          specialty,
          services (
            id,
            name,
            price,
            duration
          )
        `);

      if (error) {
        console.error('Erro ao buscar médicos:', error);
        setLoading(false);
        return;
      }

      const mappedDoctors: Doctor[] = (data || []).map((doc: any) => ({
        id: doc.id,
        name: doc.full_name,
        avatar: doc.avatar_url || '',
        specialty: doc.specialty || '',
        specialtyId: doc.specialty_id || '',
        crm: doc.crm,
        rating: doc.rating ?? 0,
        reviewCount: doc.review_count ?? 0,
        location: doc.location || '',
        city: doc.city || '',
        state: doc.state || '',
        bio: doc.bio || '',
        services: doc.services || [], // 🔥 AQUI ESTAVA O PROBLEMA
      }));

      setData(mappedDoctors);
      setLoading(false);
    };

    fetchDoctors();
  }, []);

  return { data, loading };
}
