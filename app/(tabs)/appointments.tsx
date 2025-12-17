import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, Users, X, Navigation, Trash2, ChevronRight } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/auth';
import { usePatientAppointments, useDoctorById } from '@/lib/supabase-hooks';
import { supabase } from '@/lib/supabase';

function AppointmentDetailsModal({ 
  appointment, 
  visible, 
  onClose, 
  onCancel 
}: { 
  appointment: any; 
  visible: boolean; 
  onClose: () => void;
  onCancel: (id: string) => void;
}) {
  const { data: doctor } = useDoctorById(appointment?.doctor_id);

  if (!appointment) return null;

  const handleOpenMaps = () => {
    if (doctor?.location) {
      const address = encodeURIComponent(`${doctor.location}, ${doctor.city} - ${doctor.state}`);
      const url = Platform.select({
        ios: `maps:0,0?q=${address}`,
        android: `geo:0,0?q=${address}`,
        web: `https://www.google.com/maps/search/?api=1&query=${address}`
      });
      Linking.openURL(url || '');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { bg: '#ECFDF5', text: Colors.light.success, label: 'Confirmada' };
      case 'completed':
        return { bg: '#F3F4F6', text: '#6B7280', label: 'Realizada' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#EF4444', label: 'Cancelada' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', label: 'Pendente' };
    }
  };

  const statusInfo = getStatusColor(appointment.status);

  // Parse beneficiary info from notes if needed
  let beneficiaryName = appointment.beneficiary_name;
  let beneficiaryPhone = appointment.beneficiary_phone;

  if (!appointment.is_for_self && !beneficiaryName && appointment.notes) {
    const nameMatch = appointment.notes.match(/Beneficiário: (.*?)(?: \| |$)/);
    const phoneMatch = appointment.notes.match(/Telefone: (.*?)(?: \| |$)/);
    if (nameMatch) beneficiaryName = nameMatch[1];
    if (phoneMatch) beneficiaryPhone = phoneMatch[1];
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalhes da Consulta</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            {/* Status Badge */}
            <View style={[styles.modalStatusBadge, { backgroundColor: statusInfo.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusInfo.text }]} />
              <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
            </View>

            {/* Doctor Info */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Profissional</Text>
              <View style={styles.doctorProfile}>
                <View style={styles.avatarPlaceholder}>
                   {/* In a real app we would use Image here, but text avatar is fine for now if no image */}
                   <Text style={styles.avatarText}>{appointment.doctor_name?.charAt(0)}</Text>
                </View>
                <View style={styles.doctorTextInfo}>
                  <Text style={styles.modalDoctorName}>{appointment.doctor_name}</Text>
                  <Text style={styles.modalSpecialty}>{appointment.specialty_name || 'Especialista'}</Text>
                  {doctor?.crm && <Text style={styles.crmText}>CRM: {doctor.crm}</Text>}
                </View>
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Data e Horário</Text>
              <View style={styles.row}>
                <Calendar size={20} color={Colors.light.primary} />
                <Text style={styles.rowText}>
                  {new Date(appointment.appointment_date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              <View style={[styles.row, { marginTop: 8 }]}>
                <Clock size={20} color={Colors.light.primary} />
                <Text style={styles.rowText}>{appointment.appointment_time?.slice(0, 5)}h</Text>
              </View>
            </View>

            {/* Service */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Procedimento</Text>
              <Text style={styles.serviceTitle}>{appointment.service_name}</Text>
              {appointment.service_description && (
                <Text style={styles.serviceDesc}>{appointment.service_description}</Text>
              )}
              <Text style={styles.priceText}>
                R$ {appointment.price ? Number(appointment.price).toFixed(2) : '0.00'}
              </Text>
            </View>

            {/* Location */}
            {doctor && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Localização</Text>
                <View style={styles.locationContainer}>
                  <MapPin size={20} color={Colors.light.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationText}>
                      {doctor.location || 'Endereço não informado'}
                    </Text>
                    {(doctor.city || doctor.state) && (
                      <Text style={styles.cityText}>{doctor.city} - {doctor.state}</Text>
                    )}
                  </View>
                </View>
                
                {doctor.location && (
                  <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
                    <Navigation size={18} color="#FFF" />
                    <Text style={styles.mapButtonText}>Abrir no Maps</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Beneficiary */}
            {!appointment.is_for_self && beneficiaryName && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Paciente (Beneficiário)</Text>
                <View style={styles.beneficiaryBox}>
                  <Users size={20} color={Colors.light.primary} />
                  <View>
                    <Text style={styles.beneficiaryNameLarge}>{beneficiaryName}</Text>
                    {beneficiaryPhone && (
                      <Text style={styles.beneficiaryPhoneLarge}>{beneficiaryPhone}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
             {appointment.status === 'scheduled' && (
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    onCancel(appointment.id);
                    onClose();
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancelar Consulta</Text>
                </TouchableOpacity>
             )}
             
             <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
               <Text style={styles.closeModalText}>Fechar</Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: appointments, isLoading } = usePatientAppointments(user?.id);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Cancelar Consulta',
      'Tem certeza que deseja cancelar esta consulta?',
      [
        {
          text: 'Não',
          style: 'cancel',
        },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('appointments')
              .update({ status: 'cancelled' })
              .eq('id', appointmentId);

            if (!error) {
              await queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
              await queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
              Alert.alert('Sucesso', 'Consulta cancelada com sucesso.');
            } else {
              Alert.alert('Erro', 'Não foi possível cancelar a consulta.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    Alert.alert(
      'Excluir Consulta',
      'Deseja remover esta consulta cancelada do histórico?',
      [
        {
          text: 'Não',
          style: 'cancel',
        },
        {
          text: 'Sim, Excluir',
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting appointment:', appointmentId);
            
            // Optimistic update - remove from cache immediately
            queryClient.setQueryData(
              ['patient-appointments', user?.id], 
              (oldData: any[] | undefined) => {
                if (!oldData) return [];
                const filtered = oldData.filter((apt: any) => apt.id !== appointmentId);
                console.log('Filtered appointments:', filtered.length);
                return filtered;
              }
            );

            try {
              const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointmentId);

              if (error) {
                console.error('Error deleting appointment:', error);
                // Revert optimistic update on error
                await queryClient.refetchQueries({ queryKey: ['patient-appointments', user?.id] });
                Alert.alert('Erro', 'Não foi possível remover a consulta.');
              } else {
                console.log('Appointment deleted successfully');
                // Refetch to ensure consistency
                queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
                queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
              }
            } catch (err) {
              console.error('Exception deleting appointment:', err);
              await queryClient.refetchQueries({ queryKey: ['patient-appointments', user?.id] });
              Alert.alert('Erro', 'Não foi possível remover a consulta.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { bg: '#ECFDF5', text: Colors.light.success, label: 'Confirmada' };
      case 'completed':
        return { bg: '#F3F4F6', text: '#6B7280', label: 'Realizada' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#EF4444', label: 'Cancelada' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', label: 'Pendente' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Próximas Consultas</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Carregando consultas...</Text>
          </View>
        ) : appointments && appointments.length > 0 ? (
          [...appointments]
            .sort((a: any, b: any) => {
              if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
              if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
              return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
            })
            .map((appointment: any) => {
            const statusInfo = getStatusColor(appointment.status);
            
            // Parse beneficiary info
            let beneficiaryName = appointment.beneficiary_name;
            let beneficiaryPhone = appointment.beneficiary_phone;

            if (!appointment.is_for_self && !beneficiaryName && appointment.notes) {
              const nameMatch = appointment.notes.match(/Beneficiário: (.*?)(?: \| |$)/);
              const phoneMatch = appointment.notes.match(/Telefone: (.*?)(?: \| |$)/);
              if (nameMatch) beneficiaryName = nameMatch[1];
              if (phoneMatch) beneficiaryPhone = phoneMatch[1];
            }

            return (
              <TouchableOpacity 
                key={appointment.id} 
                style={styles.appointmentCard}
                onPress={() => setSelectedAppointment(appointment)}
                activeOpacity={0.7}
              >
                <View style={styles.appointmentHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusInfo.text }]} />
                    <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                  </View>
                  <Text style={styles.dateText}>
                    {formatDate(appointment.appointment_date)}
                  </Text>
                </View>

                <Text style={styles.doctorName}>{appointment.doctor_name}</Text>
                <Text style={styles.specialty}>{appointment.specialty_name || 'Clínico Geral'}</Text>
                <Text style={styles.serviceName}>{appointment.service_name}</Text>

                {!appointment.is_for_self && beneficiaryName && (
                  <View style={styles.beneficiaryBadge}>
                    <Users size={14} color={Colors.light.primary} />
                    <View style={styles.beneficiaryInfo}>
                      <Text style={styles.beneficiaryLabel}>Consulta para:</Text>
                      <Text style={styles.beneficiaryName}>{beneficiaryName}</Text>
                      {beneficiaryPhone && (
                        <Text style={styles.beneficiaryPhone}>{beneficiaryPhone}</Text>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.appointmentInfo}>
                  <View style={styles.infoRow}>
                    <Clock size={16} color={Colors.light.textSecondary} />
                    <Text style={styles.infoText}>{appointment.appointment_time?.slice(0, 5)}</Text>
                  </View>
                  {appointment.doctor_location && (
                    <View style={styles.infoRow}>
                      <MapPin size={16} color={Colors.light.textSecondary} />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {appointment.doctor_location}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.detailsBtn}
                    onPress={() => setSelectedAppointment(appointment)}
                  >
                    <Text style={styles.detailsBtnText}>Ver Detalhes</Text>
                    <ChevronRight size={16} color={Colors.light.primary} />
                  </TouchableOpacity>

                  {appointment.status === 'scheduled' && (
                    <TouchableOpacity 
                      style={styles.cancelBtn}
                      onPress={() => handleCancelAppointment(appointment.id)}
                    >
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                  )}

                  {appointment.status === 'cancelled' && (
                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteAppointment(appointment.id)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={64} color={Colors.light.border} />
            <Text style={styles.emptyTitle}>Nenhuma consulta agendada</Text>
            <Text style={styles.emptyText}>
              Agende sua primeira consulta para começar
            </Text>
          </View>
        )}
      </ScrollView>

      <AppointmentDetailsModal 
        appointment={selectedAppointment}
        visible={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onCancel={handleCancelAppointment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.success,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  specialty: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginBottom: 10,
  },
  appointmentInfo: {
    gap: 6,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  beneficiaryBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.light.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  beneficiaryInfo: {
    flex: 1,
    gap: 2,
  },
  beneficiaryLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
  },
  beneficiaryName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  beneficiaryPhone: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  doctorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  doctorTextInfo: {
    flex: 1,
  },
  modalDoctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalSpecialty: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  crmText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 16,
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  locationText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  cityText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  beneficiaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 12,
  },
  beneficiaryNameLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  beneficiaryPhoneLarge: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  modalCancelText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 16,
  },
  closeModalBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalText: {
    color: Colors.light.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
});
