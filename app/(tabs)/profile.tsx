import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  MapPin,
  ChevronRight,
  Settings,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  Stethoscope,
  X,
  Save,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/user';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

const MENU_SECTIONS = [
  {
    title: 'Conta',
    items: [
      { icon: User, label: 'Editar Perfil', action: 'editProfile' },
      { icon: Bell, label: 'Notificações', action: 'notifications' },
      { icon: CreditCard, label: 'Formas de Pagamento', action: 'payment' },
    ],
  },
  {
    title: 'Configurações',
    items: [
      { icon: Settings, label: 'Preferências', action: 'preferences' },
      { icon: HelpCircle, label: 'Ajuda e Suporte', action: 'support' },
    ],
  },
];

export default function ProfileScreen() {
  const { user, updateUser } = useUser();
  const authContext = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });

  const handleMenuAction = (action: string) => {
    console.log('Menu action:', action);
    
    switch (action) {
      case 'editProfile':
        setEditForm({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          location: user?.location || '',
        });
        setShowEditModal(true);
        break;
      case 'notifications':
        Alert.alert(
          'Notificações',
          'Configure suas preferências de notificação.\n\n- Notificações de consultas\n- Lembretes\n- Novidades',
          [{ text: 'OK' }]
        );
        break;
      case 'payment':
        Alert.alert(
          'Formas de Pagamento',
          'Gerencie seus métodos de pagamento.\n\n- Cartões salvos\n- Adicionar novo cartão\n- Histórico de pagamentos',
          [{ text: 'OK' }]
        );
        break;
      case 'preferences':
        Alert.alert(
          'Preferências',
          'Personalize sua experiência.\n\n- Idioma\n- Tema\n- Configurações de privacidade',
          [{ text: 'OK' }]
        );
        break;
      case 'support':
        Alert.alert(
          'Ajuda e Suporte',
          'Precisa de ajuda?\n\n- Central de Ajuda\n- Fale Conosco\n- Termos de Uso\n- Política de Privacidade',
          [{ text: 'OK' }]
        );
        break;
      default:
        Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve.');
    }
  };

  const handleSaveProfile = () => {
    if (!editForm.name.trim()) {
      Alert.alert('Erro', 'Por favor, preencha seu nome.');
      return;
    }
    
    updateUser({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      location: editForm.location,
    });
    
    setShowEditModal(false);
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 User logging out');
            if (authContext?.signOut) {
              await authContext.signOut();
            } else {
              console.error('❌ Auth context not available');
              Alert.alert('Erro', 'Não foi possível fazer logout.');
            }
          },
        },
      ]
    );
  };

  const handleClearAppointments = () => {
    const authedUserId = authContext?.user?.id;

    if (!authedUserId) {
      Alert.alert('Erro', 'Você precisa estar logado para limpar as consultas.');
      return;
    }

    Alert.alert(
      'Limpar Consultas',
      'Isso irá apagar todas as suas consultas (agendadas, realizadas e canceladas). Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧹 Clearing appointments for user', authedUserId);

              const profileRole = authContext?.profile?.role;

              const deletes: Promise<{ error: unknown }>[] = [];

              deletes.push(
                (async () => {
                  const { error } = await supabase
                    .from('appointments')
                    .delete()
                    .eq('patient_id', authedUserId);
                  return { error };
                })()
              );

              if (profileRole === 'doctor') {
                deletes.push(
                  (async () => {
                    const { error } = await supabase
                      .from('appointments')
                      .delete()
                      .eq('doctor_id', authedUserId);
                    return { error };
                  })()
                );
              }

              const results = await Promise.all(deletes);
              const firstError = results.find((r) => !!r.error)?.error as any;

              if (firstError) {
                console.error('❌ Error clearing appointments', firstError);
                Alert.alert(
                  'Erro',
                  'Não foi possível limpar as consultas. ' +
                    (typeof firstError?.message === 'string' ? firstError.message : '')
                );
                return;
              }

              queryClient.removeQueries({
                predicate: (query) =>
                  query.queryKey[0] === 'patient-appointments' ||
                  query.queryKey[0] === 'doctor-appointments',
              });

              queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
              queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });

              Alert.alert('Pronto', 'Suas consultas foram apagadas.');
            } catch (e: any) {
              console.error('❌ Unexpected error clearing appointments', e);
              Alert.alert(
                'Erro',
                'Não foi possível limpar as consultas. ' +
                  (typeof e?.message === 'string' ? e.message : '')
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.userInfoRow}>
            <MapPin size={16} color={Colors.light.textSecondary} />
            <Text style={styles.userInfoText}>
              {user?.location || 'São Paulo, SP'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.editProfileBtn}
            onPress={() => handleMenuAction('editProfile')}
          >
            <Text style={styles.editProfileText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {user?.type === 'doctor' && (
          <TouchableOpacity
            style={styles.doctorDashboardCard}
            onPress={() => router.push('/doctor-dashboard')}
          >
            <View style={styles.doctorDashboardIcon}>
              <Stethoscope size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.doctorDashboardContent}>
              <Text style={styles.doctorDashboardTitle}>Dashboard Médico</Text>
              <Text style={styles.doctorDashboardSubtitle}>
                Configure seu perfil, procedimentos e agenda
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}



        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuItems}>
              {section.items.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.action}
                    style={[
                      styles.menuItem,
                      index === section.items.length - 1 && styles.menuItemLast,
                    ]}
                    onPress={() => handleMenuAction(item.action)}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIconContainer}>
                        <IconComponent size={20} color={Colors.light.primary} />
                      </View>
                      <Text style={styles.menuItemText}>{item.label}</Text>
                    </View>
                    <ChevronRight size={20} color={Colors.light.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity
          testID="clearAppointmentsButton"
          style={styles.dangerBtn}
          onPress={handleClearAppointments}
        >
          <Text style={styles.dangerBtnText}>Limpar Consultas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} testID="logoutButton">
          <LogOut size={20} color={Colors.light.error} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditModal(false)}
              >
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  placeholder="Seu nome completo"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                  placeholder="(11) 99999-9999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Localização</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.location}
                  onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                  placeholder="Cidade, Estado"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  userInfoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  editProfileBtn: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  doctorDashboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  doctorDashboardIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorDashboardContent: {
    flex: 1,
    gap: 4,
  },
  doctorDashboardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  doctorDashboardSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  testButtonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  switchToDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  switchToDoctorText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  switchToAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 12,
  },
  switchToAdminText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#7C3AED',
  },

  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuItems: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  dangerBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.error,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
