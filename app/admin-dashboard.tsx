import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Filter,
  ChevronDown,
  Edit2,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/user';
import { useDoctors, useInviteDoctor } from '@/lib/supabase-hooks';

const { width } = Dimensions.get('window');

type PeriodType = 'day' | 'month' | 'year' | 'custom';
type TabType = 'overview' | 'doctors' | 'patients' | 'appointments';

const MOCK_STATS = {
  totalAppointments: 247,
  completedAppointments: 189,
  cancelledAppointments: 12,
  totalRevenue: 87450,
  monthlyRevenue: 24800,
  growthRate: 18.5,
  totalPatients: 342,
};

const MOCK_APPOINTMENTS = [
  {
    id: '1',
    doctorName: 'Dra. Ana Silva',
    patientName: 'João Silva',
    service: 'Consulta Cardiológica',
    date: '2025-12-15',
    time: '10:00',
    status: 'completed' as const,
    price: 350,
  },
  {
    id: '2',
    doctorName: 'Dr. Carlos Mendes',
    patientName: 'Maria Santos',
    service: 'Consulta Dermatológica',
    date: '2025-12-15',
    time: '14:30',
    status: 'scheduled' as const,
    price: 380,
  },
  {
    id: '3',
    doctorName: 'Dr. Roberto Costa',
    patientName: 'Pedro Oliveira',
    service: 'Consulta Ortopédica',
    date: '2025-12-14',
    time: '09:00',
    status: 'completed' as const,
    price: 400,
  },
  {
    id: '4',
    doctorName: 'Dra. Maria Santos',
    patientName: 'Ana Costa',
    service: 'Consulta Pediátrica',
    date: '2025-12-14',
    time: '11:00',
    status: 'completed' as const,
    price: 320,
  },
  {
    id: '5',
    doctorName: 'Dr. Paulo Oliveira',
    patientName: 'Carlos Lima',
    service: 'Consulta Neurológica',
    date: '2025-12-13',
    time: '15:30',
    status: 'cancelled' as const,
    price: 420,
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { setViewMode } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('month');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  
  const { data: doctorsData } = useDoctors();
  const inviteDoctorMutation = useInviteDoctor();
  
  const doctors = doctorsData || [];
  
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    phone: '',
  });

  const filteredAppointments = selectedDoctor
    ? MOCK_APPOINTMENTS.filter((apt) =>
        doctors.find((d) => d.name === apt.doctorName)?.id === selectedDoctor
      )
    : MOCK_APPOINTMENTS;

  const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);

  const doctorRevenue = filteredAppointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.price, 0);

  const handleAddDoctor = () => {
    setDoctorForm({
      name: '',
      phone: '',
    });
    setShowAddDoctorModal(true);
  };
  
  const handleSaveDoctor = async () => {
    if (!doctorForm.name || !doctorForm.phone) {
      Alert.alert('Erro', 'Preencha nome e telefone');
      return;
    }
    
    if (!doctorForm.phone.match(/^\+?[1-9]\d{10,14}$/)) {
      Alert.alert('Erro', 'Digite um telefone válido com DDD e código do país (ex: +5511999999999)');
      return;
    }
    
    try {
      await inviteDoctorMutation.mutateAsync({
        name: doctorForm.name,
        phone: doctorForm.phone,
      });
      
      setShowAddDoctorModal(false);
      Alert.alert(
        'Médico Cadastrado',
        'Peça para ' + doctorForm.name + ' fazer login usando o telefone ' + doctorForm.phone + '. Ele poderá completar o perfil no dashboard dele.'
      );
    } catch (error: any) {
      console.error('Error adding doctor:', error);
      const errorMessage = error?.message || JSON.stringify(error);
      Alert.alert('Erro ao adicionar médico', errorMessage);
    }
  };

  const handleAddPatient = () => {
    Alert.alert(
      'Adicionar Paciente',
      'Cadastrar novo paciente no sistema.\n\n• Nome completo\n• CPF\n• Data de nascimento\n• Contato\n• Convênio',
      [{ text: 'OK' }]
    );
  };

  const handleEditDoctor = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    Alert.alert(
      'Editar Médico',
      `Editar informações de ${doctor?.name || 'médico'}.\n\nEsta funcionalidade abrirá um formulário completo para edição.`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteDoctor = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    Alert.alert(
      'Remover Médico',
      `Tem certeza que deseja remover ${doctor?.name || 'este médico'} do sistema?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            console.log('Doctor removed:', doctorId);
            Alert.alert('Sucesso', 'Médico removido do sistema.');
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <LayoutDashboard size={24} color="#7C3AED" />
            </View>
            <Text style={styles.headerTitle}>Dashboard Admin</Text>
            <Text style={styles.headerSubtitle}>
              Gestão completa do sistema
            </Text>
            <View style={styles.testModeButtons}>
              <TouchableOpacity
                style={styles.testModeButton}
                onPress={() => {
                  setViewMode('patient');
                  router.push('/');
                }}
              >
                <Text style={styles.testModeButtonText}>Modo Paciente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.testModeButton, styles.testModeButtonDoctor]}
                onPress={() => {
                  setViewMode('doctor');
                  router.push('/doctor-dashboard' as any);
                }}
              >
                <Text style={[styles.testModeButtonText, styles.testModeButtonTextDoctor]}>Modo Médico</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => setActiveTab('overview')}
            >
              <TrendingUp
                size={18}
                color={
                  activeTab === 'overview' ? '#FFFFFF' : Colors.light.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'overview' && styles.tabTextActive,
                ]}
              >
                Visão Geral
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'doctors' && styles.tabActive]}
              onPress={() => setActiveTab('doctors')}
            >
              <Stethoscope
                size={18}
                color={
                  activeTab === 'doctors' ? '#FFFFFF' : Colors.light.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'doctors' && styles.tabTextActive,
                ]}
              >
                Médicos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'patients' && styles.tabActive]}
              onPress={() => setActiveTab('patients')}
            >
              <Users
                size={18}
                color={
                  activeTab === 'patients' ? '#FFFFFF' : Colors.light.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'patients' && styles.tabTextActive,
                ]}
              >
                Pacientes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'appointments' && styles.tabActive,
              ]}
              onPress={() => setActiveTab('appointments')}
            >
              <Calendar
                size={18}
                color={
                  activeTab === 'appointments'
                    ? '#FFFFFF'
                    : Colors.light.textSecondary
                }
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
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'overview' && (
            <>
              <View style={styles.filtersContainer}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowPeriodModal(true)}
                >
                  <Filter size={16} color={Colors.light.text} />
                  <Text style={styles.filterButtonText}>
                    {periodFilter === 'day'
                      ? 'Hoje'
                      : periodFilter === 'month'
                      ? 'Este Mês'
                      : periodFilter === 'year'
                      ? 'Este Ano'
                      : 'Período Personalizado'}
                  </Text>
                  <ChevronDown size={16} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.statCardPrimary]}>
                  <View style={styles.statIconContainer}>
                    <Calendar size={24} color="#7C3AED" />
                  </View>
                  <Text style={styles.statValue}>
                    {MOCK_STATS.totalAppointments}
                  </Text>
                  <Text style={styles.statLabel}>Total de Consultas</Text>
                </View>

                <View style={[styles.statCard, styles.statCardSuccess]}>
                  <View style={styles.statIconContainer}>
                    <DollarSign size={24} color="#10B981" />
                  </View>
                  <Text style={styles.statValue}>
                    R$ {(MOCK_STATS.totalRevenue / 1000).toFixed(0)}k
                  </Text>
                  <Text style={styles.statLabel}>Receita Total</Text>
                </View>

                <View style={[styles.statCard, styles.statCardInfo]}>
                  <View style={styles.statIconContainer}>
                    <Stethoscope size={24} color={Colors.light.primary} />
                  </View>
                  <Text style={styles.statValue}>{doctors.length}</Text>
                  <Text style={styles.statLabel}>Médicos Ativos</Text>
                </View>

                <View style={[styles.statCard, styles.statCardWarning]}>
                  <View style={styles.statIconContainer}>
                    <Users size={24} color="#F59E0B" />
                  </View>
                  <Text style={styles.statValue}>{MOCK_STATS.totalPatients}</Text>
                  <Text style={styles.statLabel}>Pacientes</Text>
                </View>
              </View>

              <View style={styles.revenueCard}>
                <View style={styles.revenueHeader}>
                  <View>
                    <Text style={styles.revenueTitle}>Receita do Mês</Text>
                    <Text style={styles.revenueAmount}>
                      R$ {MOCK_STATS.monthlyRevenue.toLocaleString('pt-BR')}
                    </Text>
                  </View>
                  <View style={styles.growthBadge}>
                    <TrendingUp size={16} color="#10B981" />
                    <Text style={styles.growthText}>
                      +{MOCK_STATS.growthRate}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.revenueSubtext}>
                  Crescimento comparado ao mês anterior
                </Text>
              </View>

              <View style={styles.quickStats}>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>
                    {MOCK_STATS.completedAppointments}
                  </Text>
                  <Text style={styles.quickStatLabel}>Concluídas</Text>
                  <View style={[styles.quickStatBar, { width: '80%' }]} />
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>
                    {MOCK_STATS.totalAppointments -
                      MOCK_STATS.completedAppointments -
                      MOCK_STATS.cancelledAppointments}
                  </Text>
                  <Text style={styles.quickStatLabel}>Agendadas</Text>
                  <View
                    style={[
                      styles.quickStatBar,
                      { width: '60%', backgroundColor: '#F59E0B' },
                    ]}
                  />
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>
                    {MOCK_STATS.cancelledAppointments}
                  </Text>
                  <Text style={styles.quickStatLabel}>Canceladas</Text>
                  <View
                    style={[
                      styles.quickStatBar,
                      { width: '20%', backgroundColor: Colors.light.error },
                    ]}
                  />
                </View>
              </View>
            </>
          )}

          {activeTab === 'doctors' && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Médicos Cadastrados ({doctors.length})
                </Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddDoctor}>
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Adicionar</Text>
                </TouchableOpacity>
              </View>

              {doctors.map((doctor) => (
                <View key={doctor.id} style={styles.doctorCard}>
                  <View style={styles.doctorInfo}>
                    <View style={styles.doctorAvatar}>
                      <Text style={styles.doctorAvatarText}>
                        {doctor.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.doctorDetails}>
                      <Text style={styles.doctorName}>{doctor.name}</Text>
                      <Text style={styles.doctorSpecialty}>
                        {doctor.specialty}
                      </Text>
                      <Text style={styles.doctorCrm}>{doctor.crm}</Text>
                    </View>
                  </View>
                  <View style={styles.doctorStats}>
                    <View style={styles.doctorStatItem}>
                      <Text style={styles.doctorStatValue}>
                        {doctor.rating}
                      </Text>
                      <Text style={styles.doctorStatLabel}>Rating</Text>
                    </View>
                    <View style={styles.doctorStatDivider} />
                    <View style={styles.doctorStatItem}>
                      <Text style={styles.doctorStatValue}>
                        {doctor.reviewCount}
                      </Text>
                      <Text style={styles.doctorStatLabel}>Avaliações</Text>
                    </View>
                  </View>
                  <View style={styles.doctorActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEditDoctor(doctor.id)}
                    >
                      <Edit2 size={16} color={Colors.light.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteDoctor(doctor.id)}
                    >
                      <Trash2 size={16} color={Colors.light.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {activeTab === 'patients' && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Pacientes Cadastrados ({MOCK_STATS.totalPatients})
                </Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddPatient}>
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Adicionar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.emptyState}>
                <Users size={64} color={Colors.light.border} />
                <Text style={styles.emptyTitle}>
                  Lista de Pacientes
                </Text>
                <Text style={styles.emptyText}>
                  Aqui apareceriam todos os pacientes cadastrados no sistema
                  com opções de edição e visualização de histórico
                </Text>
              </View>
            </>
          )}

          {activeTab === 'appointments' && (
            <>
              <View style={styles.filtersContainer}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowPeriodModal(true)}
                >
                  <Filter size={16} color={Colors.light.text} />
                  <Text style={styles.filterButtonText}>
                    {periodFilter === 'day'
                      ? 'Hoje'
                      : periodFilter === 'month'
                      ? 'Este Mês'
                      : periodFilter === 'year'
                      ? 'Este Ano'
                      : 'Período Personalizado'}
                  </Text>
                  <ChevronDown size={16} color={Colors.light.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowDoctorModal(true)}
                >
                  <Stethoscope size={16} color={Colors.light.text} />
                  <Text style={styles.filterButtonText}>
                    {selectedDoctorData?.name || 'Todos os Médicos'}
                  </Text>
                  <ChevronDown size={16} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              </View>

              {selectedDoctor && (
                <View style={styles.doctorRevenueCard}>
                  <View style={styles.doctorRevenueHeader}>
                    <Text style={styles.doctorRevenueTitle}>
                      Receita de {selectedDoctorData?.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSelectedDoctor(null)}
                      style={styles.clearFilterButton}
                    >
                      <X size={16} color={Colors.light.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.doctorRevenueAmount}>
                    R$ {doctorRevenue.toLocaleString('pt-BR')}
                  </Text>
                  <Text style={styles.doctorRevenueSubtext}>
                    {filteredAppointments.filter((a) => a.status === 'completed').length}{' '}
                    consultas concluídas
                  </Text>
                </View>
              )}

              <Text style={styles.appointmentListTitle}>
                Consultas Recentes ({filteredAppointments.length})
              </Text>

              {filteredAppointments.map((appointment) => (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View
                      style={[
                        styles.statusBadge,
                        appointment.status === 'completed' &&
                          styles.statusBadgeCompleted,
                        appointment.status === 'cancelled' &&
                          styles.statusBadgeCancelled,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          appointment.status === 'completed' &&
                            styles.statusDotCompleted,
                          appointment.status === 'cancelled' &&
                            styles.statusDotCancelled,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          appointment.status === 'completed' &&
                            styles.statusTextCompleted,
                          appointment.status === 'cancelled' &&
                            styles.statusTextCancelled,
                        ]}
                      >
                        {appointment.status === 'scheduled'
                          ? 'Agendada'
                          : appointment.status === 'completed'
                          ? 'Concluída'
                          : 'Cancelada'}
                      </Text>
                    </View>
                    <Text style={styles.appointmentPrice}>
                      R$ {appointment.price}
                    </Text>
                  </View>

                  <View style={styles.appointmentBody}>
                    <View style={styles.appointmentCol}>
                      <Text style={styles.appointmentLabel}>Médico</Text>
                      <Text style={styles.appointmentValue}>
                        {appointment.doctorName}
                      </Text>
                    </View>
                    <View style={styles.appointmentCol}>
                      <Text style={styles.appointmentLabel}>Paciente</Text>
                      <Text style={styles.appointmentValue}>
                        {appointment.patientName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appointmentBody}>
                    <View style={styles.appointmentCol}>
                      <Text style={styles.appointmentLabel}>Data</Text>
                      <Text style={styles.appointmentValue}>
                        {new Date(appointment.date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <View style={styles.appointmentCol}>
                      <Text style={styles.appointmentLabel}>Horário</Text>
                      <Text style={styles.appointmentValue}>
                        {appointment.time}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.appointmentService}>
                    {appointment.service}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        <Modal
          visible={showPeriodModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPeriodModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPeriodModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filtrar por Período</Text>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setPeriodFilter('day');
                  setShowPeriodModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Hoje</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setPeriodFilter('month');
                  setShowPeriodModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Este Mês</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setPeriodFilter('year');
                  setShowPeriodModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Este Ano</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setPeriodFilter('custom');
                  setShowPeriodModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>Período Personalizado</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showDoctorModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDoctorModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDoctorModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filtrar por Médico</Text>
              <ScrollView style={styles.modalScroll}>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedDoctor(null);
                    setShowDoctorModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>Todos os Médicos</Text>
                </TouchableOpacity>
                {doctors.map((doctor) => (
                  <TouchableOpacity
                    key={doctor.id}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedDoctor(doctor.id);
                      setShowDoctorModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{doctor.name}</Text>
                    <Text style={styles.modalOptionSubtext}>
                      {doctor.specialty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showAddDoctorModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddDoctorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.formModal]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Adicionar Médico</Text>
                <TouchableOpacity
                  onPress={() => setShowAddDoctorModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.formDescription}>
                  Cadastre apenas o nome e telefone do médico. Ele completará o perfil (CRM, especialidade, foto, etc.) após fazer login.
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Nome Completo *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Dr. João Silva"
                    value={doctorForm.name}
                    onChangeText={(text) => setDoctorForm({ ...doctorForm, name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Telefone * (com código do país)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="+5511999999999"
                    value={doctorForm.phone}
                    onChangeText={(text) => setDoctorForm({ ...doctorForm, phone: text })}
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.formHint}>
                    O médico usará este número para fazer login e completar o cadastro
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.formButtonSecondary]}
                  onPress={() => setShowAddDoctorModal(false)}
                >
                  <Text style={styles.formButtonTextSecondary}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.formButtonPrimary]}
                  onPress={handleSaveDoctor}
                  disabled={inviteDoctorMutation.isPending}
                >
                  <Text style={styles.formButtonText}>
                    {inviteDoctorMutation.isPending ? 'Cadastrando...' : 'Cadastrar Médico'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center' as const,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
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
  testModeButtonDoctor: {
    borderColor: Colors.light.primary,
  },
  testModeButtonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  testModeButtonTextDoctor: {
    color: Colors.light.primary,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tabsContainer: {
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
  },
  tabActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  revenueCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  growthText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  revenueSubtext: {
    fontSize: 13,
    color: '#E9D5FF',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickStatItem: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  quickStatBar: {
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  doctorCard: {
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
  doctorInfo: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  doctorDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  doctorCrm: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  doctorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
  },
  doctorStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  doctorStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  doctorStatLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  doctorStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.border,
  },
  doctorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    lineHeight: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  doctorRevenueCard: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  doctorRevenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorRevenueTitle: {
    fontSize: 14,
    color: '#D1FAE5',
  },
  clearFilterButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorRevenueAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  doctorRevenueSubtext: {
    fontSize: 13,
    color: '#D1FAE5',
  },
  appointmentListTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
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
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FEF2F2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  statusDotCompleted: {
    backgroundColor: '#10B981',
  },
  statusDotCancelled: {
    backgroundColor: Colors.light.error,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  statusTextCompleted: {
    color: '#10B981',
  },
  statusTextCancelled: {
    color: Colors.light.error,
  },
  appointmentPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  appointmentBody: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  appointmentCol: {
    flex: 1,
  },
  appointmentLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  appointmentValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  appointmentService: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '600' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  modalOptionSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  formModal: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  specialtyChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  specialtyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  specialtyChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  specialtyChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  specialtyChipTextActive: {
    color: '#FFFFFF',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  formButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formButtonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  formButtonSecondary: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  formButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
});
