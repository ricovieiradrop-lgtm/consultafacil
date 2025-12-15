import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';

const MOCK_APPOINTMENTS = [
  {
    id: '1',
    doctorName: 'Dra. Ana Silva',
    specialty: 'Cardiologia',
    service: 'Consulta Cardiológica',
    date: '2025-01-20',
    time: '10:00',
    location: 'Av. Paulista, 1578',
    status: 'confirmed' as const,
  },
  {
    id: '2',
    doctorName: 'Dr. Carlos Mendes',
    specialty: 'Dermatologia',
    service: 'Consulta Dermatológica',
    date: '2025-01-22',
    time: '14:30',
    location: 'Rua das Laranjeiras, 456',
    status: 'confirmed' as const,
  },
];

export default function AppointmentsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Consultas</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_APPOINTMENTS.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Confirmada</Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(appointment.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })}
              </Text>
            </View>

            <Text style={styles.doctorName}>{appointment.doctorName}</Text>
            <Text style={styles.specialty}>{appointment.specialty}</Text>
            <Text style={styles.serviceName}>{appointment.service}</Text>

            <View style={styles.appointmentInfo}>
              <View style={styles.infoRow}>
                <Clock size={16} color={Colors.light.textSecondary} />
                <Text style={styles.infoText}>{appointment.time}</Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={16} color={Colors.light.textSecondary} />
                <Text style={styles.infoText} numberOfLines={1}>
                  {appointment.location}
                </Text>
              </View>
            </View>

            <View style={styles.appointmentActions}>
              <TouchableOpacity style={styles.actionBtnSecondary}>
                <Text style={styles.actionBtnSecondaryText}>Remarcar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnPrimary}>
                <Text style={styles.actionBtnPrimaryText}>Ver Detalhes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {MOCK_APPOINTMENTS.length === 0 && (
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
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginBottom: 16,
  },
  appointmentInfo: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  actionBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 14,
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
});
