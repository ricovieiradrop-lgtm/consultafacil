import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { Doctor, Service, Specialty } from '@/types';

export function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Specialty[];
    },
  });
}

export function useDoctors(filters?: { specialtyId?: string; city?: string; state?: string }) {
  return useQuery({
    queryKey: ['doctors', filters],
    queryFn: async () => {
      let query = supabase
        .from('doctor_listings')
        .select('*')
        .order('rating', { ascending: false });

      if (filters?.specialtyId) {
        query = query.eq('specialty_id', filters.specialtyId);
      }
      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }

      const { data, error } = await query;
      if (error) throw error;

      const doctors: Doctor[] = (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        crm: d.crm,
        specialty: d.specialty || '',
        specialtyId: d.specialty_id || '',
        avatar: d.avatar || '',
        rating: d.rating || 0,
        reviewCount: d.review_count || 0,
        location: d.location || '',
        city: d.city || '',
        state: d.state || '',
        bio: d.bio || '',
        services: [],
        availableSlots: [],
      }));

      return doctors;
    },
  });
}

export function useDoctorById(doctorId: string) {
  return useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: async () => {
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctor_listings')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (doctorError) throw doctorError;

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('active', true);

      const doctor: Doctor = {
        id: doctorData.id,
        name: doctorData.name,
        crm: doctorData.crm,
        specialty: doctorData.specialty || '',
        specialtyId: doctorData.specialty_id || '',
        avatar: doctorData.avatar || '',
        rating: doctorData.rating || 0,
        reviewCount: doctorData.review_count || 0,
        location: doctorData.location || '',
        city: doctorData.city || '',
        state: doctorData.state || '',
        bio: doctorData.bio || '',
        services: (servicesData || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          price: parseFloat(s.price),
          duration: s.duration,
        })),
        availableSlots: [],
      };

      return doctor;
    },
    enabled: !!doctorId,
  });
}

export function useDoctorServices(doctorId: string) {
  return useQuery({
    queryKey: ['services', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        price: parseFloat(s.price),
        duration: s.duration,
      })) as Service[];
    },
    enabled: !!doctorId,
  });
}

export function useDoctorAvailability(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['availability', doctorId, date],
    queryFn: async () => {
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();

      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (error) throw error;

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .in('status', ['scheduled']);

      const bookedTimes = (appointmentsData || []).map((a: any) => a.appointment_time);

      const slots: string[] = [];
      (data || []).forEach((slot: any) => {
        const start = slot.start_time.substring(0, 5);
        const end = slot.end_time.substring(0, 5);
        const startHour = parseInt(start.split(':')[0]);
        const startMinute = parseInt(start.split(':')[1]);
        const endHour = parseInt(end.split(':')[0]);
        const endMinute = parseInt(end.split(':')[1]);

        for (let h = startHour; h < endHour || (h === endHour && startMinute < endMinute); h++) {
          const time = `${h.toString().padStart(2, '0')}:00`;
          if (!bookedTimes.includes(time)) {
            slots.push(time);
          }
          if (h < endHour - 1 || (h === endHour - 1 && endMinute > 0)) {
            const halfTime = `${h.toString().padStart(2, '0')}:30`;
            if (!bookedTimes.includes(halfTime)) {
              slots.push(halfTime);
            }
          }
        }
      });

      return slots.sort();
    },
    enabled: !!doctorId && !!date,
  });
}

export function useAppointments(userId?: string, userType?: string) {
  return useQuery({
    queryKey: ['appointments', userId, userType],
    queryFn: async () => {
      let query = supabase.from('appointment_details').select('*');

      if (userType === 'patient' && userId) {
        query = query.eq('patient_id', userId);
      } else if (userType === 'doctor' && userId) {
        query = query.eq('doctor_id', userId);
      }

      const { data, error } = await query.order('appointment_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((a: any) => ({
        id: a.id,
        doctorId: a.doctor_id,
        patientId: a.patient_id,
        serviceId: a.service_id,
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status,
        price: parseFloat(a.price),
        doctorName: a.doctor_name,
        doctorAvatar: a.doctor_avatar,
        doctorSpecialty: a.doctor_specialty,
        patientName: a.patient_name,
        patientEmail: a.patient_email,
        serviceName: a.service_name,
      }));
    },
    enabled: !!userId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: {
      doctorId: string;
      patientId: string;
      serviceId: string;
      date: string;
      time: string;
      price: number;
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          doctor_id: appointment.doctorId,
          patient_id: appointment.patientId,
          service_id: appointment.serviceId,
          appointment_date: appointment.date,
          appointment_time: appointment.time,
          status: 'scheduled',
          price: appointment.price,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'scheduled' | 'completed' | 'cancelled' }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useCreateOrUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: {
      id?: string;
      doctorId: string;
      name: string;
      description: string;
      price: number;
      duration: number;
    }) => {
      if (service.id) {
        const { data, error } = await supabase
          .from('services')
          .update({
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
          })
          .eq('id', service.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert({
            doctor_id: service.doctorId,
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            active: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services', variables.doctorId] });
      queryClient.invalidateQueries({ queryKey: ['doctor', variables.doctorId] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, doctorId }: { id: string; doctorId: string }) => {
      const { error } = await supabase
        .from('services')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      return { id, doctorId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services', data.doctorId] });
      queryClient.invalidateQueries({ queryKey: ['doctor', data.doctorId] });
    },
  });
}

export function useInviteDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctor: {
      name: string;
      phone: string;
    }) => {
      console.log('Creating doctor with basic info:', doctor);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          phone: doctor.phone,
          full_name: doctor.name,
          role: 'doctor',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este telefone já está cadastrado no sistema');
        }
        throw error;
      }

      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          id: data.id,
          crm: '',
          bio: '',
        });

      if (doctorError) {
        await supabase.from('profiles').delete().eq('id', data.id);
        throw doctorError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useCreateOrUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctor: {
      id?: string;
      name: string;
      email: string;
      phone?: string;
      avatar?: string;
      crm: string;
      specialtyId: string;
      bio: string;
      location?: string;
      city?: string;
      state?: string;
    }) => {
      if (doctor.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: doctor.name,
            phone: doctor.phone || '',
            avatar_url: doctor.avatar,
            location: doctor.location,
            city: doctor.city,
            state: doctor.state,
          })
          .eq('id', doctor.id);

        if (profileError) throw profileError;

        const { data, error: doctorError } = await supabase
          .from('doctors')
          .update({
            crm: doctor.crm,
            specialty_id: doctor.specialtyId,
            bio: doctor.bio,
          })
          .eq('id', doctor.id)
          .select()
          .single();

        if (doctorError) throw doctorError;
        return data;
      } else {
        throw new Error('Para adicionar novo médico, use o convite por SMS');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useCreateOrUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availability: {
      id?: string;
      doctorId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }) => {
      if (availability.id) {
        const { data, error } = await supabase
          .from('doctor_availability')
          .update({
            start_time: availability.startTime,
            end_time: availability.endTime,
            is_active: true,
          })
          .eq('id', availability.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('doctor_availability')
          .insert({
            doctor_id: availability.doctorId,
            day_of_week: availability.dayOfWeek,
            start_time: availability.startTime,
            end_time: availability.endTime,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['availability', variables.doctorId] });
    },
  });
}

export function useAdminStats(filters?: { startDate?: string; endDate?: string; doctorId?: string }) {
  return useQuery({
    queryKey: ['admin-stats', filters],
    queryFn: async () => {
      let query = supabase.from('appointments').select('*');

      if (filters?.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }
      if (filters?.startDate) {
        query = query.gte('appointment_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('appointment_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const appointments = data || [];
      const totalAppointments = appointments.length;
      const scheduledAppointments = appointments.filter((a: any) => a.status === 'scheduled').length;
      const completedAppointments = appointments.filter((a: any) => a.status === 'completed').length;
      const cancelledAppointments = appointments.filter((a: any) => a.status === 'cancelled').length;
      const totalRevenue = appointments
        .filter((a: any) => a.status === 'completed')
        .reduce((sum: number, a: any) => sum + parseFloat(a.price), 0);

      return {
        totalAppointments,
        scheduledAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
      };
    },
  });
}
