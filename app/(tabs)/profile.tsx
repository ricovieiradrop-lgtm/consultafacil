import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
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
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/user';
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
  const { user, switchUserType } = useUser();
  const router = useRouter();

  const handleMenuAction = (action: string) => {
    console.log('Menu action:', action);
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

          <TouchableOpacity style={styles.editProfileBtn}>
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

        {user?.type === 'patient' && (
          <View style={styles.testButtonsContainer}>
            <TouchableOpacity
              style={styles.switchToDoctorBtn}
              onPress={() => switchUserType('doctor')}
            >
              <Stethoscope size={18} color={Colors.light.primary} />
              <Text style={styles.switchToDoctorText}>Modo Teste: Acessar como Médico</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchToAdminBtn}
              onPress={() => router.push('/admin-dashboard' as any)}
            >
              <Settings size={18} color="#7C3AED" />
              <Text style={styles.switchToAdminText}>Modo Teste: Dashboard Admin</Text>
            </TouchableOpacity>
          </View>
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

        <TouchableOpacity style={styles.logoutBtn}>
          <LogOut size={20} color={Colors.light.error} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
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
});
