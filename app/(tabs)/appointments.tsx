import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin, Users } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/auth';
import { usePatientAppointments } from '@/lib/supabase-hooks';
import { supabase } from '@/lib/supabase';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: appointments, isLoading } = usePatientAppointments(user?.id);

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
              queryClient.removeQueries({ 
                predicate: (query) => 
                  query.queryKey[0] === 'patient-appointments'
              });
              Alert.alert('Sucesso', 'Consulta cancelada com sucesso.');
            } else {
              Alert.alert('Erro', 'Não foi possível cancelar a consulta.');
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
          appointments.map((appointment: any) => {
            const statusInfo = getStatusColor(appointment.status);
            return (
              <View key={appointment.id} style={styles.appointmentCard}>
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

                {!appointment.is_for_self && appointment.beneficiary_name && (
                  <View style={styles.beneficiaryBadge}>
                    <Users size={14} color={Colors.light.primary} />
                    <View style={styles.beneficiaryInfo}>
                      <Text style={styles.beneficiaryLabel}>Consulta para:</Text>
                      <Text style={styles.beneficiaryName}>{appointment.beneficiary_name}</Text>
                      {appointment.beneficiary_phone && (
                        <Text style={styles.beneficiaryPhone}>{appointment.beneficiary_phone}</Text>
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

                {appointment.status === 'scheduled' && (
                  <TouchableOpacity 
                    style={styles.cancelBtn}
                    onPress={() => handleCancelAppointment(appointment.id)}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar Consulta</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  cancelBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
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
});
