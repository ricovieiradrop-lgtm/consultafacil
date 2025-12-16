import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';

const { height } = Dimensions.get('window');

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const AVAILABLE_DATES = [
  '2025-01-20', '2025-01-21', '2025-01-22', '2025-01-23', '2025-01-24',
  '2025-01-27', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

export default function BookingModal() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const doctorId = params.doctorId as string;
  const serviceId = params.serviceId as string;
  const price = Number(params.price);

  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 0, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: {
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isAvailable: boolean;
    }[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: '', day: 0, isCurrentMonth: false, isAvailable: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isAvailable: AVAILABLE_DATES.includes(dateStr),
      });
    }

    return days;
  }, [currentMonth]);

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuário não autenticado');
      }

      const patientId = userData.user.id;

      const { error } = await supabase.from('appointments').insert({
        doctor_id: doctorId,
        patient_id: patientId,
        service_id: serviceId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        price,
        status: 'scheduled',
      });

      if (error) {
        throw error;
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);

    } catch (err: any) {
      Alert.alert(
        'Erro ao agendar',
        err.message || 'Não foi possível concluir o agendamento'
      );
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <CheckCircle size={64} color={Colors.light.success} />
            <Text style={styles.successTitle}>Consulta Agendada!</Text>
            <Text style={styles.successText}>
              O médico receberá a solicitação.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Agendar Consulta</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* CALENDÁRIO */}
            <View style={styles.section}>
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={() => setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                )}>
                  <ChevronLeft />
                </TouchableOpacity>

                <Text style={styles.monthTitle}>
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>

                <TouchableOpacity onPress={() => setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                )}>
                  <ChevronRight />
                </TouchableOpacity>
              </View>

              <View style={styles.calendarGrid}>
                {calendarDays.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    disabled={!item.isAvailable}
                    style={[
                      styles.calendarCell,
                      item.isAvailable && styles.available,
                      selectedDate === item.date && styles.selected,
                    ]}
                    onPress={() => {
                      setSelectedDate(item.date);
                      setSelectedTime(null);
                    }}
                  >
                    <Text>{item.day || ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* HORÁRIOS */}
            {selectedDate && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Horários</Text>
                <View style={styles.timeSlots}>
                  {TIME_SLOTS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.timeSlotActive,
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text>{time}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (!selectedDate || !selectedTime || loading) && styles.disabled,
            ]}
            disabled={!selectedDate || !selectedTime || loading}
            onPress={handleConfirmBooking}
          >
            <Text style={styles.confirmText}>
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/* estilos mantidos */
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.9 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20 },
  section: { marginBottom: 24 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthTitle: { fontSize: 18, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.28%', padding: 10, alignItems: 'center' },
  available: { backgroundColor: '#eee', borderRadius: 8 },
  selected: { backgroundColor: Colors.light.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  timeSlots: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  timeSlot: { padding: 12, borderRadius: 8, borderWidth: 1 },
  timeSlotActive: { backgroundColor: Colors.light.primary },
  confirmBtn: { padding: 18, backgroundColor: Colors.light.primary, alignItems: 'center' },
  disabled: { backgroundColor: '#ccc' },
  confirmText: { color: '#fff', fontWeight: '700' },
  successOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successCard: { backgroundColor: '#fff', padding: 32, borderRadius: 24, alignItems: 'center' },
  successTitle: { fontSize: 22, fontWeight: '700', marginTop: 12 },
  successText: { marginTop: 8 },
});
