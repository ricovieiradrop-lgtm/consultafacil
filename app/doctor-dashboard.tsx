import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Camera,
  Plus,
  Trash2,
  Clock,
  DollarSign,
  Calendar,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/user';
import { useRouter } from 'expo-router';
import { Service } from '@/types';
import * as ImagePicker from 'expo-image-picker';

type TabType = 'profile' | 'procedures' | 'schedule' | 'appointments';

type DaySchedule = {
  enabled: boolean;
  slots: string[];
};

type WeekSchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

const DAYS = [
  { key: 'monday' as const, label: 'Segunda' },
  { key: 'tuesday' as const, label: 'Terça' },
  { key: 'wednesday' as const, label: 'Quarta' },
  { key: 'thursday' as const, label: 'Quinta' },
  { key: 'friday' as const, label: 'Sexta' },
  { key: 'saturday' as const, label: 'Sábado' },
  { key: 'sunday' as const, label: 'Domingo' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

export default function DoctorDashboardScreen() {
  const { user, updateUser } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [appointmentsFilter, setAppointmentsFilter] = useState<'upcoming' | 'completed'>('upcoming');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    crm: '',
    specialty: '',
    bio: '',
    location: user?.location || '',
  });

  const [procedures, setProcedures] = useState<Service[]>([
    {
      id: '1',
      name: 'Consulta Geral',
      description: 'Consulta médica geral',
      price: 200,
      duration: 30,
    },
  ]);

  const [newProcedure, setNewProcedure] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
  });

  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { enabled: true, slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
    tuesday: { enabled: true, slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
    wednesday: { enabled: true, slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
    thursday: { enabled: true, slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
    friday: { enabled: true, slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
  });

  const mockAppointments = [
    {
      id: '1',
      patientName: 'João Silva',
      service: 'Consulta Geral',
      date: '2025-12-20',
      time: '10:00',
      status: 'upcoming' as const,
      price: 200,
    },
    {
      id: '2',
      patientName: 'Maria Santos',
      service: 'Consulta de Retorno',
      date: '2025-12-22',
      time: '14:30',
      status: 'upcoming' as const,
      price: 150,
    },
    {
      id: '3',
      patientName: 'Pedro Oliveira',
      service: 'Consulta Geral',
      date: '2025-12-10',
      time: '09:00',
      status: 'completed' as const,
      price: 200,
    },
    {
      id: '4',
      patientName: 'Ana Costa',
      service: 'Consulta Geral',
      date: '2025-12-12',
      time: '11:00',
      status: 'completed' as const,
      price: 200,
    },
    {
      id: '5',
      patientName: 'Carlos Lima',
      service: 'Consulta de Retorno',
      date: '2025-12-14',
      time: '15:30',
      status: 'completed' as const,
      price: 150,
    },
  ];

  const filteredAppointments = mockAppointments.filter(
    (apt) => apt.status === appointmentsFilter
  );

  const handleCancelAppointment = (id: string) => {
    Alert.alert(
      'Cancelar Consulta',
      'Tem certeza que deseja cancelar esta consulta?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: () => {
            console.log('Cancelled appointment:', id);
            Alert.alert('Sucesso', 'Consulta cancelada');
          },
        },
      ]
    );
  };

  const handleCompleteAppointment = (id: string) => {
    Alert.alert(
      'Finalizar Consulta',
      'Marcar esta consulta como concluída?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Finalizar',
          onPress: () => {
            console.log('Completed appointment:', id);
            Alert.alert('Sucesso', 'Consulta finalizada');
          },
        },
      ]
    );
  };

  const handleSaveProfile = () => {
    console.log('Saving profile:', profileForm);
    updateUser({
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      location: profileForm.location,
    });
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  const handleAddProcedure = () => {
    if (!newProcedure.name || !newProcedure.price) {
      Alert.alert('Erro', 'Preencha nome e preço do procedimento');
      return;
    }

    const procedure: Service = {
      id: Date.now().toString(),
      name: newProcedure.name,
      description: newProcedure.description,
      price: parseFloat(newProcedure.price),
      duration: parseInt(newProcedure.duration),
    };

    setProcedures([...procedures, procedure]);
    setNewProcedure({ name: '', description: '', price: '', duration: '30' });
    Alert.alert('Sucesso', 'Procedimento adicionado!');
  };

  const handleDeleteProcedure = (id: string) => {
    setProcedures(procedures.filter((p) => p.id !== id));
  };

  const toggleDay = (day: keyof WeekSchedule) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], enabled: !schedule[day].enabled },
    });
  };

  const toggleSlot = (day: keyof WeekSchedule, slot: string) => {
    const daySchedule = schedule[day];
    const slots = daySchedule.slots.includes(slot)
      ? daySchedule.slots.filter((s) => s !== slot)
      : [...daySchedule.slots, slot].sort();

    setSchedule({
      ...schedule,
      [day]: { ...daySchedule, slots },
    });
  };

  const handleSaveSchedule = () => {
    console.log('Saving schedule:', schedule);
    Alert.alert('Sucesso', 'Agenda configurada com sucesso!');
  };

  const handleSelectPhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de acesso à sua galeria para selecionar fotos.'
        );
        return;
      }
    }

    Alert.alert(
      'Foto de Perfil',
      'Selecione uma opção:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Galeria',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                console.log('Selected image:', imageUri);
                updateUser({ avatar: imageUri });
                Alert.alert('Sucesso', 'Foto de perfil atualizada!');
              }
            } catch (error) {
              console.error('Error picking image:', error);
              Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
            }
          },
        },
        {
          text: 'Câmera',
          onPress: async () => {
            if (Platform.OS === 'web') {
              Alert.alert('Não disponível', 'Câmera não está disponível na web.');
              return;
            }

            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Permissão Necessária',
                'Precisamos de acesso à câmera para tirar fotos.'
              );
              return;
            }

            try {
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                console.log('Captured image:', imageUri);
                updateUser({ avatar: imageUri });
                Alert.alert('Sucesso', 'Foto de perfil atualizada!');
              }
            } catch (error) {
              console.error('Error taking photo:', error);
              Alert.alert('Erro', 'Não foi possível tirar a foto.');
            }
          },
        },
      ]
    );
  };

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoContainer} onPress={handleSelectPhoto}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera size={32} color={Colors.light.textSecondary} />
            </View>
          )}
          <View style={styles.photoOverlay}>
            <Camera size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Recomendado: 400x400px</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput
          style={styles.input}
          value={profileForm.name}
          onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
          placeholder="Seu nome completo"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={profileForm.email}
          onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Telefone</Text>
        <TextInput
          style={styles.input}
          value={profileForm.phone}
          onChangeText={(text) => setProfileForm({ ...profileForm, phone: text })}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>CRM</Text>
        <TextInput
          style={styles.input}
          value={profileForm.crm}
          onChangeText={(text) => setProfileForm({ ...profileForm, crm: text })}
          placeholder="Ex: 123456/SP"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Especialidade</Text>
        <TextInput
          style={styles.input}
          value={profileForm.specialty}
          onChangeText={(text) => setProfileForm({ ...profileForm, specialty: text })}
          placeholder="Ex: Cardiologia"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Localização</Text>
        <TextInput
          style={styles.input}
          value={profileForm.location}
          onChangeText={(text) => setProfileForm({ ...profileForm, location: text })}
          placeholder="Cidade, Estado"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Sobre você</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={profileForm.bio}
          onChangeText={(text) => setProfileForm({ ...profileForm, bio: text })}
          placeholder="Descreva sua experiência e especialidades"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
        <Text style={styles.saveButtonText}>Salvar Perfil</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProceduresTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.addProcedureCard}>
        <Text style={styles.sectionTitle}>Adicionar Procedimento</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome do Procedimento</Text>
          <TextInput
            style={styles.input}
            value={newProcedure.name}
            onChangeText={(text) => setNewProcedure({ ...newProcedure, name: text })}
            placeholder="Ex: Consulta de Retorno"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={newProcedure.description}
            onChangeText={(text) => setNewProcedure({ ...newProcedure, description: text })}
            placeholder="Breve descrição do procedimento"
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Preço (R$)</Text>
            <TextInput
              style={styles.input}
              value={newProcedure.price}
              onChangeText={(text) => setNewProcedure({ ...newProcedure, price: text })}
              placeholder="200"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Duração (min)</Text>
            <TextInput
              style={styles.input}
              value={newProcedure.duration}
              onChangeText={(text) => setNewProcedure({ ...newProcedure, duration: text })}
              placeholder="30"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddProcedure}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.proceduresList}>
        <Text style={styles.sectionTitle}>Procedimentos Cadastrados</Text>
        {procedures.map((procedure) => (
          <View key={procedure.id} style={styles.procedureCard}>
            <View style={styles.procedureInfo}>
              <Text style={styles.procedureName}>{procedure.name}</Text>
              {procedure.description ? (
                <Text style={styles.procedureDescription}>{procedure.description}</Text>
              ) : null}
              <View style={styles.procedureMeta}>
                <View style={styles.procedureMetaItem}>
                  <DollarSign size={14} color={Colors.light.primary} />
                  <Text style={styles.procedurePrice}>
                    R$ {procedure.price.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.procedureMetaItem}>
                  <Clock size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.procedureDuration}>{procedure.duration} min</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteProcedure(procedure.id)}
            >
              <Trash2 size={18} color={Colors.light.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAppointmentsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.appointmentsHeader}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            appointmentsFilter === 'upcoming' && styles.filterTabActive,
          ]}
          onPress={() => setAppointmentsFilter('upcoming')}
        >
          <Text
            style={[
              styles.filterTabText,
              appointmentsFilter === 'upcoming' && styles.filterTabTextActive,
            ]}
          >
            Próximas Consultas
          </Text>
          <View
            style={[
              styles.filterBadge,
              appointmentsFilter === 'upcoming' && styles.filterBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.filterBadgeText,
                appointmentsFilter === 'upcoming' && styles.filterBadgeTextActive,
              ]}
            >
              {mockAppointments.filter((a) => a.status === 'upcoming').length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            appointmentsFilter === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => setAppointmentsFilter('completed')}
        >
          <Text
            style={[
              styles.filterTabText,
              appointmentsFilter === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Concluídas
          </Text>
          <View
            style={[
              styles.filterBadge,
              appointmentsFilter === 'completed' && styles.filterBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.filterBadgeText,
                appointmentsFilter === 'completed' && styles.filterBadgeTextActive,
              ]}
            >
              {mockAppointments.filter((a) => a.status === 'completed').length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {filteredAppointments.length === 0 ? (
        <View style={styles.emptyAppointments}>
          <AlertCircle size={48} color={Colors.light.border} />
          <Text style={styles.emptyAppointmentsTitle}>
            {appointmentsFilter === 'upcoming'
              ? 'Nenhuma consulta agendada'
              : 'Nenhuma consulta concluída'}
          </Text>
          <Text style={styles.emptyAppointmentsText}>
            {appointmentsFilter === 'upcoming'
              ? 'Quando pacientes agendarem consultas, elas aparecerão aqui'
              : 'Suas consultas finalizadas aparecerão aqui'}
          </Text>
        </View>
      ) : (
        filteredAppointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.appointmentCardHeader}>
              <View>
                <Text style={styles.appointmentPatient}>
                  {appointment.patientName}
                </Text>
                <Text style={styles.appointmentService}>
                  {appointment.service}
                </Text>
              </View>
              <Text style={styles.appointmentPrice}>
                R$ {appointment.price.toFixed(2)}
              </Text>
            </View>

            <View style={styles.appointmentDetails}>
              <View style={styles.appointmentDetailItem}>
                <Calendar size={16} color={Colors.light.textSecondary} />
                <Text style={styles.appointmentDetailText}>
                  {new Date(appointment.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.appointmentDetailItem}>
                <Clock size={16} color={Colors.light.textSecondary} />
                <Text style={styles.appointmentDetailText}>
                  {appointment.time}
                </Text>
              </View>
            </View>

            {appointment.status === 'upcoming' && (
              <View style={styles.appointmentActions}>
                <TouchableOpacity
                  style={[styles.appointmentButton, styles.appointmentButtonComplete]}
                  onPress={() => handleCompleteAppointment(appointment.id)}
                >
                  <CheckCircle2 size={18} color="#10B981" />
                  <Text style={styles.appointmentButtonCompleteText}>
                    Finalizar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.appointmentButton, styles.appointmentButtonCancel]}
                  onPress={() => handleCancelAppointment(appointment.id)}
                >
                  <X size={18} color={Colors.light.error} />
                  <Text style={styles.appointmentButtonCancelText}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {appointment.status === 'completed' && (
              <View style={styles.completedBadge}>
                <CheckCircle2 size={16} color="#10B981" />
                <Text style={styles.completedBadgeText}>Concluída</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderScheduleTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Configurar Horários Disponíveis</Text>
      <Text style={styles.sectionSubtitle}>
        Selecione os dias e horários em que você estará disponível para atendimento
      </Text>

      {DAYS.map(({ key, label }) => (
        <View key={key} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <TouchableOpacity
              style={styles.dayToggle}
              onPress={() => toggleDay(key)}
            >
              <View
                style={[
                  styles.checkbox,
                  schedule[key].enabled && styles.checkboxActive,
                ]}
              >
                {schedule[key].enabled && <Check size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.dayLabel}>{label}</Text>
            </TouchableOpacity>
          </View>

          {schedule[key].enabled && (
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = schedule[key].slots.includes(slot);
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.slotChip,
                      isSelected && styles.slotChipActive,
                    ]}
                    onPress={() => toggleSlot(key, slot)}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        isSelected && styles.slotTextActive,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveSchedule}>
        <Text style={styles.saveButtonText}>Salvar Agenda</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <X size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dashboard Médico</Text>
          <View style={styles.testModeButtons}>
            <TouchableOpacity
              style={styles.testModeButton}
              onPress={() => {
                updateUser({ type: 'patient' });
                router.back();
              }}
            >
              <Text style={styles.testModeButtonText}>Modo Paciente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.testModeButton, styles.testModeButtonAdmin]}
              onPress={() => router.push('/admin-dashboard' as any)}
            >
              <Text style={[styles.testModeButtonText, styles.testModeButtonTextAdmin]}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <User
            size={20}
            color={activeTab === 'profile' ? Colors.light.primary : Colors.light.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'profile' && styles.tabTextActive,
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'procedures' && styles.tabActive]}
          onPress={() => setActiveTab('procedures')}
        >
          <DollarSign
            size={20}
            color={activeTab === 'procedures' ? Colors.light.primary : Colors.light.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'procedures' && styles.tabTextActive,
            ]}
          >
            Procedimentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <Calendar
            size={20}
            color={activeTab === 'schedule' ? Colors.light.primary : Colors.light.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'schedule' && styles.tabTextActive,
            ]}
          >
            Agenda
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
        >
          <CheckCircle2
            size={20}
            color={activeTab === 'appointments' ? Colors.light.primary : Colors.light.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'appointments' && styles.tabTextActive,
            ]}
          >
            Consultas
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'procedures' && renderProceduresTab()}
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'appointments' && renderAppointmentsTab()}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  testModeButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  testModeButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  testModeButtonAdmin: {
    borderColor: '#7C3AED',
  },
  testModeButtonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  testModeButtonTextAdmin: {
    color: '#7C3AED',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.card,
  },
  photoHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  addProcedureCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  proceduresList: {
    gap: 12,
  },
  procedureCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  procedureInfo: {
    flex: 1,
    gap: 6,
  },
  procedureName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  procedureDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  procedureMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  procedureMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  procedurePrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  procedureDuration: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  dayCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    marginBottom: 12,
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  slotChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  slotTextActive: {
    color: '#FFFFFF',
  },
  appointmentsHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  filterTabActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  appointmentCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  appointmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentPatient: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  appointmentService: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  appointmentPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  appointmentDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  appointmentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentDetailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  appointmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  appointmentButtonComplete: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  appointmentButtonCompleteText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  appointmentButtonCancel: {
    backgroundColor: '#FEF2F2',
    borderColor: Colors.light.error,
  },
  appointmentButtonCancelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.error,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completedBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  emptyAppointments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyAppointmentsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyAppointmentsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
