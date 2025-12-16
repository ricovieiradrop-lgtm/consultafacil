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

export default function BookingScreen() {
  const router = useRouter();
  const { doctorId, serviceId, price } = useLocalSearchParams();

  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 0, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔒 Blindagem: se veio sem contexto, não continua
  if (!doctorId || !serviceId || !price) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Médico não encontrado</Text>
        <Text style={styles.errorText}>
          Volte e selecione um médico válido para agendar.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekDay = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startWeekDay; i++) {
      days.push({ date: '', day: 0, available: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        available: AVAILABLE_DATES.includes(dateStr),
      });
    }

    return days;
  }, [currentMonth]);

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('appointments').insert({
      doctor_id: doctorId,
      patient_id: user.id,
      service_id: serviceId,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      price: Number(price),
    });

    if (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível agendar a consulta');
      setLoading(false);
      return;
    }

    setShowSuccess(true);
    setTimeout(() => router.replace('/(tabs)/appointments'), 2000);
  };

  if (showSuccess) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <CheckCircle size={64} color={Colors.light.success} />
            <Text style={styles.successTitle}>Consulta Agendada!</Text>
            <Text style={styles.successText}>
              Você pode acompanhar em “Minhas Consultas”.
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
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
              }>
                <ChevronLeft size={24} />
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>

              <TouchableOpacity onPress={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
              }>
                <ChevronRight size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  disabled={!d.available}
                  style={[
                    styles.calendarCell,
                    selectedDate === d.date && styles.selectedCell,
                  ]}
                  onPress={() => setSelectedDate(d.date)}
                >
                  <Text>{d.day || ''}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedDate && (
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setSelectedTime(t)}
                    style={[
                      styles.timeSlot,
                      selectedTime === t && styles.timeSlotActive,
                    ]}
                  >
                    <Text>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            disabled={!selectedDate || !selectedTime || loading}
            onPress={handleConfirmBooking}
            style={styles.confirmBtn}
          >
            <Text style={styles.confirmBtnText}>
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  monthTitle: { fontSize: 18, fontWeight: '700' },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.2%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCell: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
  },
  timeSlot: {
    width: '23%',
    padding: 12,
    margin: 4,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  timeSlotActive: {
    backgroundColor: Colors.light.primary,
  },
  confirmBtn: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
  successOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  successCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '700', marginTop: 12 },
  successText: { textAlign: 'center', marginTop: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorTitle: { fontSize: 20, fontWeight: '700' },
  errorText: { marginTop: 8, color: '#666', textAlign: 'center' },
  backBtn: {
    marginTop: 20,
    padding: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  backBtnText: { color: '#fff' },
});
