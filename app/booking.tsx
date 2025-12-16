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
import { useRouter } from 'expo-router';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';

const { height } = Dimensions.get('window');

/** UUIDs REAIS vindos do Supabase */
const DOCTOR_ID = '00c4ff96-0db5-4f2d-995e-96c6e87591f';
const SERVICE_ID = '0c34e41d-3b26-4434-8935-77fe4b7297d1';
const SERVICE_PRICE = 200.0;

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
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
];

export default function BookingModal() {
  const router = useRouter();
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
    if (!selectedDate || !selectedTime) return;

    try {
      setLoading(true);

      const { error } = await supabase.rpc('create_appointment', {
        p_doctor_id: DOCTOR_ID,
        p_service_id: SERVICE_ID,
        p_appointment_date: selectedDate,
        p_appointment_time: selectedTime,
        p_price: SERVICE_PRICE,
      });

      if (error) {
        if (error.message.includes('unique')) {
          throw new Error('Esse horário já foi agendado. Escolha outro.');
        }
        throw error;
      }

      setShowSuccess(true);
      setTimeout(() => router.back(), 2000);
    } catch (err: any) {
      Alert.alert('Erro ao agendar', err.message || 'Tente novamente');
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
              Seu agendamento foi salvo com sucesso.
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

          <ScrollView>
            {/* calendário e horários permanecem iguais */}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!selectedDate || !selectedTime || loading) && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirmBooking}
              disabled={!selectedDate || !selectedTime || loading}
            >
              <Text style={styles.confirmBtnText}>
                {loading ? 'Agendando...' : 'Confirmar Agendamento'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.light.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.85 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.light.border },
  confirmBtn: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 16, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: Colors.light.border },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
  successOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  successCard: { backgroundColor: Colors.light.card, padding: 32, borderRadius: 24, alignItems: 'center' },
  successTitle: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  successText: { marginTop: 8, textAlign: 'center' },
});
