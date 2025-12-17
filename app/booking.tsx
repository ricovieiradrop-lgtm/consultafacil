import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, User, Users } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useDoctorAvailability, useDoctorAppointments, usePatientAppointments } from '@/lib/supabase-hooks';

const { height } = Dimensions.get('window');

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

function generateAvailableDates(availability: { day_of_week: number }[]): string[] {
  const dates: string[] = [];
  const today = new Date();
  const activeDays = availability.map(a => a.day_of_week);
  
  for (let i = 1; i <= 60; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (activeDays.length === 0 || activeDays.includes(date.getDay())) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  
  return dates;
}

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  
  const doctorId = typeof params.doctorId === 'string' ? params.doctorId : undefined;
  const serviceId = typeof params.serviceId === 'string' ? params.serviceId : undefined;
  const price = typeof params.price === 'string' ? params.price : undefined;

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showExistingAppointment, setShowExistingAppointment] = useState(false);
  const [existingAppointment, setExistingAppointment] = useState<any>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showBeneficiarySelection, setShowBeneficiarySelection] = useState(true);
  const [isForSelf, setIsForSelf] = useState(true);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('');

  const { data: availability } = useDoctorAvailability(doctorId);
  const { data: existingAppointments } = useDoctorAppointments(doctorId, selectedDate || undefined);
  const { data: patientAppointments, refetch: refetchPatientAppointments } = usePatientAppointments(userId || undefined);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId && refetchPatientAppointments) {
      console.log('🔄 Refetching patient appointments for booking screen');
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === 'patient-appointments'
      });
      refetchPatientAppointments();
    }
  }, [userId, doctorId, refetchPatientAppointments, queryClient]);

  useEffect(() => {
    if (!patientAppointments || !doctorId) return;

    const scheduledAppointment = patientAppointments.find(
      (apt: any) => apt.doctor_id === doctorId && apt.status === 'scheduled'
    );

    if (scheduledAppointment && !isRescheduling) {
      setExistingAppointment(scheduledAppointment);
      setShowExistingAppointment(true);
    }
  }, [patientAppointments, doctorId, isRescheduling]);

  const availableDates = useMemo(() => {
    return generateAvailableDates(availability || []);
  }, [availability]);

  const bookedTimes = useMemo(() => {
    return (existingAppointments || []).map((apt: any) => apt.appointment_time?.slice(0, 5));
  }, [existingAppointments]);

  const timeSlots = useMemo(() => {
    return DEFAULT_TIME_SLOTS.filter(time => !bookedTimes.includes(time));
  }, [bookedTimes]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekDay = firstDay.getDay();

    const days: { date: string; day: number; available: boolean }[] = [];

    for (let i = 0; i < startWeekDay; i++) {
      days.push({ date: '', day: 0, available: false });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, month, day);
      const isPast = dateObj < today;
      
      days.push({
        date: dateStr,
        day,
        available: !isPast && availableDates.includes(dateStr),
      });
    }

    return days;
  }, [currentMonth, availableDates]);

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !doctorId || !serviceId || !price) return;

    if (!isForSelf && (!beneficiaryName.trim() || !beneficiaryPhone.trim())) {
      Alert.alert('Erro', 'Preencha o nome e telefone do beneficiário');
      return;
    }

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

    if (isRescheduling && existingAppointment) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          notes: isForSelf 
            ? null 
            : `Beneficiário: ${beneficiaryName} | Telefone: ${beneficiaryPhone}`,
        })
        .eq('id', existingAppointment.id);

      if (updateError) {
        console.error('Reschedule error:', updateError);
        Alert.alert('Erro', 'Não foi possível remarcar a consulta. ' + updateError.message);
        setLoading(false);
        return;
      }
    } else {
      // Check if there's a cancelled appointment for this slot and delete it first
      const { data: cancelledAppt } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', selectedDate)
        .eq('appointment_time', selectedTime)
        .eq('status', 'cancelled')
        .single();

      if (cancelledAppt) {
        await supabase
          .from('appointments')
          .delete()
          .eq('id', cancelledAppt.id);
      }

      const { error } = await supabase.from('appointments').insert({
        doctor_id: doctorId,
        patient_id: user.id,
        service_id: serviceId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        price: Number(price),
        notes: isForSelf 
          ? null 
          : `Beneficiário: ${beneficiaryName} | Telefone: ${beneficiaryPhone}`,
      });

      if (error) {
        console.error('Booking error:', error);
        Alert.alert('Erro', 'Não foi possível agendar a consulta. ' + error.message);
        setLoading(false);
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
    
    setLoading(false);
    setShowSuccess(true);
    setTimeout(() => router.replace('/(tabs)/appointments'), 2000);
  };

  const handleReschedule = () => {
    setIsRescheduling(true);
    setShowExistingAppointment(false);
    setShowBeneficiarySelection(true);
  };

  const handleBeneficiaryConfirm = () => {
    if (!isForSelf && (!beneficiaryName.trim() || !beneficiaryPhone.trim())) {
      Alert.alert('Atenção', 'Preencha o nome e telefone do beneficiário');
      return;
    }
    setShowBeneficiarySelection(false);
  };

  const handleCancelExisting = () => {
    setShowExistingAppointment(false);
    router.back();
  };

  if (!doctorId || !serviceId || !price) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Dados incompletos</Text>
        <Text style={styles.errorText}>
          Volte e selecione um médico e serviço para agendar.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (showExistingAppointment && existingAppointment) {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <AlertCircle size={64} color={Colors.light.primary} />
            <Text style={styles.alertTitle}>Consulta Agendada</Text>
            <Text style={styles.alertText}>
              Você já possui uma consulta agendada com este médico:
            </Text>
            <View style={styles.existingAppointmentInfo}>
              <Text style={styles.existingAppointmentDate}>
                {formatDate(existingAppointment.appointment_date)}
              </Text>
              <Text style={styles.existingAppointmentTime}>
                às {existingAppointment.appointment_time?.slice(0, 5)}
              </Text>
            </View>
            <Text style={styles.alertSubText}>
              {existingAppointment.service_name}
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertBtnSecondary}
                onPress={handleCancelExisting}
              >
                <Text style={styles.alertBtnSecondaryText}>Continuar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertBtnReschedule}
                onPress={handleReschedule}
              >
                <Text style={styles.alertBtnRescheduleText}>Remarcar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (showBeneficiarySelection && !showExistingAppointment) {
    return (
      <Modal visible transparent animationType="fade">
        <KeyboardAvoidingView 
          style={styles.beneficiaryOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.beneficiaryOverlay}
            onPress={() => router.back()}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              style={styles.beneficiaryCard}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.beneficiaryTitle}>Para quem é essa Consulta?</Text>
              
              <View style={styles.beneficiaryOptions}>
                <TouchableOpacity
                  style={[
                    styles.beneficiaryOption,
                    isForSelf && styles.beneficiaryOptionActive,
                  ]}
                  onPress={() => {
                    setIsForSelf(true);
                    setBeneficiaryName('');
                    setBeneficiaryPhone('');
                  }}
                >
                  <User 
                    size={32} 
                    color={isForSelf ? '#FFFFFF' : Colors.light.primary} 
                  />
                  <Text style={[
                    styles.beneficiaryOptionText,
                    isForSelf && styles.beneficiaryOptionTextActive,
                  ]}>Para Mim</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.beneficiaryOption,
                    !isForSelf && styles.beneficiaryOptionActive,
                  ]}
                  onPress={() => setIsForSelf(false)}
                >
                  <Users 
                    size={32} 
                    color={!isForSelf ? '#FFFFFF' : Colors.light.primary} 
                  />
                  <Text style={[
                    styles.beneficiaryOptionText,
                    !isForSelf && styles.beneficiaryOptionTextActive,
                  ]}>Para outra Pessoa</Text>
                </TouchableOpacity>
              </View>

              {!isForSelf && (
                <View style={styles.beneficiaryForm}>
                  <Text style={styles.beneficiaryFormTitle}>Dados do Beneficiário</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nome Completo</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Digite o nome completo"
                      value={beneficiaryName}
                      onChangeText={setBeneficiaryName}
                      placeholderTextColor={Colors.light.border}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Telefone para Contato</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="(00) 00000-0000"
                      value={beneficiaryPhone}
                      onChangeText={setBeneficiaryPhone}
                      keyboardType="phone-pad"
                      placeholderTextColor={Colors.light.border}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.beneficiaryConfirmBtn}
                onPress={handleBeneficiaryConfirm}
              >
                <Text style={styles.beneficiaryConfirmText}>Continuar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.beneficiaryCancelBtn}
                onPress={() => router.back()}
              >
                <Text style={styles.beneficiaryCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  if (showSuccess) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <CheckCircle size={64} color={Colors.light.success} />
            <Text style={styles.successTitle}>
              {isRescheduling ? 'Consulta Remarcada!' : 'Consulta Agendada!'}
            </Text>
            <Text style={styles.successText}>
              Você pode acompanhar em Minhas Consultas.
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
            <Text style={styles.headerTitle}>
              {isRescheduling ? 'Remarcar Consulta' : 'Agendar Consulta'}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
              }>
                <ChevronLeft size={24} color={Colors.light.text} />
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>

              <TouchableOpacity onPress={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
              }>
                <ChevronRight size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdaysRow}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <Text key={day} style={styles.weekdayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  disabled={!d.available}
                  style={[
                    styles.calendarCell,
                    d.available && styles.calendarCellAvailable,
                    selectedDate === d.date && styles.selectedCell,
                  ]}
                  onPress={() => {
                    setSelectedDate(d.date);
                    setSelectedTime(null);
                  }}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !d.available && d.day > 0 && styles.calendarDayDisabled,
                    selectedDate === d.date && styles.calendarDaySelected,
                  ]}>
                    {d.day || ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedDate && (
              <View style={styles.timeSection}>
                <Text style={styles.timeSectionTitle}>Horários disponíveis</Text>
                {timeSlots.length > 0 ? (
                  <View style={styles.timeGrid}>
                    {timeSlots.map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setSelectedTime(t)}
                        style={[
                          styles.timeSlot,
                          selectedTime === t && styles.timeSlotActive,
                        ]}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          selectedTime === t && styles.timeSlotTextActive,
                        ]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noTimesText}>Nenhum horário disponível nesta data</Text>
                )}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            disabled={!selectedDate || !selectedTime || loading}
            onPress={handleConfirmBooking}
            style={[
              styles.confirmBtn,
              (!selectedDate || !selectedTime) && styles.confirmBtnDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmBtnText}>
                {isRescheduling ? 'Confirmar Remarcação' : 'Confirmar Agendamento'}
              </Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

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
    maxHeight: height * 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  monthTitle: { 
    fontSize: 18, 
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  calendarCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellAvailable: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  calendarDayDisabled: {
    color: Colors.light.border,
  },
  calendarDaySelected: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  timeSection: {
    padding: 20,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
    color: Colors.light.text,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '23%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
  },
  timeSlotActive: {
    backgroundColor: Colors.light.primary,
  },
  timeSlotText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
  },
  noTimesText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  confirmBtn: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: { 
    color: '#fff', 
    fontWeight: '700' as const,
    fontSize: 16,
  },
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
    marginHorizontal: 40,
  },
  successTitle: { 
    fontSize: 22, 
    fontWeight: '700' as const, 
    marginTop: 12,
    color: Colors.light.text,
  },
  successText: { 
    textAlign: 'center', 
    marginTop: 8,
    color: Colors.light.textSecondary,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: { 
    fontSize: 20, 
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  errorText: { 
    marginTop: 8, 
    color: Colors.light.textSecondary, 
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 20,
    padding: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  backBtnText: { 
    color: '#fff',
    fontWeight: '600' as const,
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginHorizontal: 40,
    maxWidth: 400,
  },
  alertTitle: { 
    fontSize: 22, 
    fontWeight: '700' as const, 
    marginTop: 16,
    color: Colors.light.text,
  },
  alertText: { 
    textAlign: 'center', 
    marginTop: 12,
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  alertSubText: { 
    textAlign: 'center', 
    marginTop: 8,
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  existingAppointmentInfo: {
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  existingAppointmentDate: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  existingAppointmentTime: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.primary,
    marginTop: 4,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  alertBtnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  alertBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  alertBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  alertBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  alertBtnReschedule: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  alertBtnRescheduleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  beneficiaryOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  beneficiaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  beneficiaryTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  beneficiaryOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  beneficiaryOption: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
    gap: 8,
  },
  beneficiaryOptionActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  beneficiaryOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
  },
  beneficiaryOptionTextActive: {
    color: '#FFFFFF',
  },
  beneficiaryForm: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  beneficiaryFormTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  beneficiaryConfirmBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  beneficiaryConfirmText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  beneficiaryCancelBtn: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  beneficiaryCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
});
