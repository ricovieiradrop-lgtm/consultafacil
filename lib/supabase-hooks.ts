import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Specialty = {
  id: string;
  name: string;
  icon: string;
};

export type Service = {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  is_active?: boolean;
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

export type DoctorAvailability = {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export function useSpecialties() {
  const [data, setData] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const { data: specialties, error } = await supabase
          .from('specialties')
          .select('*');
        
        if (!error && specialties) {
          setData(specialties);
        }
      } catch (err) {
        console.error('Error fetching specialties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  return { data, loading };
}

export function useDoctors() {
  const [data, setData] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data: doctorListings, error: listingsError } = await supabase
          .from('doctor_listings')
          .select('*');

        if (listingsError) {
          console.error('Error fetching doctor listings:', listingsError);
          setLoading(false);
          return;
        }

        if (!doctorListings || doctorListings.length === 0) {
          console.log('No doctors found in database');
          setData([]);
          setLoading(false);
          return;
        }

        const doctorIds = doctorListings.map((d: any) => d.id);
        
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .in('doctor_id', doctorIds)
          .eq('is_active', true);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        }

        const servicesMap = new Map<string, Service[]>();
        (services || []).forEach((service: any) => {
          const existing = servicesMap.get(service.doctor_id) || [];
          existing.push({
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            is_active: service.is_active,
          });
          servicesMap.set(service.doctor_id, existing);
        });

        const mappedDoctors: Doctor[] = doctorListings.map((doc: any) => ({
          id: doc.id,
          name: doc.full_name,
          avatar: doc.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
          specialty: doc.specialty || 'Clínico Geral',
          specialtyId: doc.specialty_id || '',
          crm: doc.crm || '',
          rating: doc.rating ?? 0,
          reviewCount: doc.review_count ?? 0,
          location: doc.location || '',
          city: doc.city || '',
          state: doc.state || '',
          bio: doc.bio || '',
          services: servicesMap.get(doc.id) || [],
        }));

        console.log('✅ Loaded', mappedDoctors.length, 'doctors from Supabase');
        setData(mappedDoctors);
      } catch (err) {
        console.error('Error in fetchDoctors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  return { data, loading };
}

export function useDoctorById(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: async () => {
      if (!doctorId) return null;

      const { data: doctorListing, error: listingError } = await supabase
        .from('doctor_listings')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (listingError) {
        console.error('Error fetching doctor:', listingError);
        return null;
      }

      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_active', true);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      }

      const doctor: Doctor = {
        id: doctorListing.id,
        name: doctorListing.full_name,
        avatar: doctorListing.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
        specialty: doctorListing.specialty || 'Clínico Geral',
        specialtyId: doctorListing.specialty_id || '',
        crm: doctorListing.crm || '',
        rating: doctorListing.rating ?? 0,
        reviewCount: doctorListing.review_count ?? 0,
        location: doctorListing.location || '',
        city: doctorListing.city || '',
        state: doctorListing.state || '',
        bio: doctorListing.bio || '',
        services: (services || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price,
          duration: s.duration,
          is_active: s.is_active,
        })),
      };

      return doctor;
    },
    enabled: !!doctorId,
  });
}

export function useDoctorAvailability(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching availability:', error);
        return [];
      }

      return data as DoctorAvailability[];
    },
    enabled: !!doctorId,
  });
}

export function useDoctorAppointments(doctorId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ['doctor-appointments', doctorId, date],
    queryFn: async () => {
      if (!doctorId) return [];

      let query = supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('status', 'scheduled');

      if (date) {
        query = query.eq('appointment_date', date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return data;
    },
    enabled: !!doctorId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: {
      doctor_id: string;
      patient_id: string;
      service_id: string;
      appointment_date: string;
      appointment_time: string;
      price: number;
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
  });
}

export function usePatientAppointments(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient-appointments', patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('appointment_details')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching patient appointments:', error);
        return [];
      }

      return data;
    },
    enabled: !!patientId,
  });
}

export function useInviteDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      console.log('📨 Inviting doctor:', name, phone);
      
      const { data, error } = await supabase
        .rpc('admin_invite_doctor', {
          p_phone: phone,
          p_name: name,
        });

      if (error) {
        console.error('Error inviting doctor:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useDoctorServices(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['doctor-services', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching services:', error);
        return [];
      }

      return data as Service[];
    },
    enabled: !!doctorId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: {
      doctor_id: string;
      name: string;
      description?: string;
      price: number;
      duration: number;
    }) => {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single();

      if (error) {
        console.error('Error creating service:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-services', variables.doctor_id] });
      queryClient.invalidateQueries({ queryKey: ['doctor', variables.doctor_id] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, doctorId }: { serviceId: string; doctorId: string }) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('Error deleting service:', error);
        throw error;
      }

      return { serviceId, doctorId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-services', data.doctorId] });
      queryClient.invalidateQueries({ queryKey: ['doctor', data.doctorId] });
    },
  });
}

export function useSaveDoctorAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      doctorId, 
      availability 
    }: { 
      doctorId: string; 
      availability: {
        day_of_week: number;
        start_time: string;
        end_time: string;
        is_active: boolean;
      }[];
    }) => {
      const { error: deleteError } = await supabase
        .from('doctor_availability')
        .delete()
        .eq('doctor_id', doctorId);

      if (deleteError) {
        console.error('Error deleting old availability:', deleteError);
        throw deleteError;
      }

      if (availability.length === 0) {
        return [];
      }

      const records = availability.map(a => ({
        doctor_id: doctorId,
        day_of_week: a.day_of_week,
        start_time: a.start_time,
        end_time: a.end_time,
        is_active: a.is_active,
      }));

      const { data, error } = await supabase
        .from('doctor_availability')
        .insert(records)
        .select();

      if (error) {
        console.error('Error saving availability:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability', variables.doctorId] });
    },
  });
}

export function useDoctorProfile(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['doctor-profile', doctorId],
    queryFn: async () => {
      if (!doctorId) return null;

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*, profiles(*), specialties(*)')
        .eq('id', doctorId)
        .single();

      if (doctorError) {
        console.error('Error fetching doctor profile:', doctorError);
        return null;
      }

      return doctorData;
    },
    enabled: !!doctorId,
  });
}

export function useUpdateDoctorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      doctorId,
      profileUpdates,
      doctorUpdates,
    }: {
      doctorId: string;
      profileUpdates?: {
        full_name?: string;
        phone?: string;
        avatar_url?: string;
        location?: string;
        city?: string;
        state?: string;
      };
      doctorUpdates?: {
        crm?: string;
        specialty_id?: string;
        bio?: string;
      };
    }) => {
      if (profileUpdates && Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', doctorId);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          throw profileError;
        }
      }

      if (doctorUpdates && Object.keys(doctorUpdates).length > 0) {
        const { error: doctorError } = await supabase
          .from('doctors')
          .update(doctorUpdates)
          .eq('id', doctorId);

        if (doctorError) {
          console.error('Error updating doctor:', doctorError);
          throw doctorError;
        }
      }

      return { doctorId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile', data.doctorId] });
      queryClient.invalidateQueries({ queryKey: ['doctor', data.doctorId] });
    },
  });
}

export function useDoctorAppointmentsList(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['doctor-appointments-list', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from('appointment_details')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching doctor appointments:', error);
        return [];
      }

      return data;
    },
    enabled: !!doctorId,
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: 'scheduled' | 'completed' | 'cancelled';
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments-list'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
  });
}
