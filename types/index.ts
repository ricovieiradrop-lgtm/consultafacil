export type UserType = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  avatar?: string;
  phone?: string;
  location?: string;
}

export interface Specialty {
  id: string;
  name: string;
  icon: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export interface Doctor {
  id: string;
  name: string;
  crm: string;
  specialty: string;
  specialtyId: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  location: string;
  city: string;
  state: string;
  bio: string;
  services: Service[];
  availableSlots: string[];
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  price: number;
}
