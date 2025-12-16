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

// ⚠️ UUIDs FIXOS PARA MVP (trocaremos depois)
const DOCTOR_ID = 'UUID_DO_MEDICO_AQUI';
const SERVICE_ID = 'UUID_DO_SERVICO_AQUI';
const SERVICE_PRICE = 200.0;

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

    const days: { date: string; day: number; isCurrentMonth: boolean; isAvailable: boolean }[] = [];

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

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || loading) return;

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
          Alert.alert('Horário indisponível', 'Esse horário já foi ocupado. Escolha outro.');
        } else {
          Alert.alert('Erro', error.message);
        }
        return;
      }

      setShowSuccess(true);

      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível agendar a consulta.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color={Colors.light.success} />
            </View>
            <Text style={styles.successTitle}>Consulta Agendada!</Text>
            <Text style={styles.successText}>
              Sua consulta foi registrada com sucesso.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Agendar Consulta</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                  <ChevronLeft size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                  <ChevronRight size={24} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day) => (
                  <View key={day} style={styles.weekdayCell}>
                    <Text style={styles.weekdayText}>{day}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarDays.map((item, index) => {
                  if (!item.isCurrentMonth) {
                    return <View key={`empty-${index}`} style={styles.calendarCell} />;
                  }

                  const isSelected = selectedDate === item.date;

                  return (
                    <TouchableOpacity
                      key={item.date}
                      style={[
                        styles.calendarCell,
                        item.isAvailable && styles.calendarCellAvailable,
                        isSelected && styles.calendarCellSelected,
                      ]}
                      onPress={() => {
                        if (item.isAvailable) {
                          setSelectedDate(item.date);
                          setSelectedTime(null);
                        }
                      }}
                      disabled={!item.isAvailable}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          !item.isAvailable && styles.calendarDayDisabled,
                          isSelected && styles.calendarDaySelected,
                        ]}
                      >
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedDate && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Horários Disponíveis</Text>
                  <View style={styles.timeSlotsGrid}>
                    {TIME_SLOTS.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlot,
                          selectedTime === time && styles.timeSlotActive,
                        ]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            selectedTime === time && styles.timeSlotTextActive,
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
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

/* =======================
   STYLES (INALTERADOS)
======================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 20,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calendarCellAvailable: {
    borderRadius: 12,
  },
  calendarCellSelected: {
    backgroundColor: Colors.light.primary,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  calendarDayDisabled: {
    color: Colors.light.border,
  },
  calendarDaySelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    width: '23%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  timeSlotActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  confirmBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.light.border,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
