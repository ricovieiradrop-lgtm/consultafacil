import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  SlidersHorizontal,
  Star,
  Heart,
  User,
  Bone,
  Baby,
  Brain,
  Eye,
  Stethoscope,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/user';
import { useSpecialties, useDoctors } from '@/lib/supabase-hooks';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: specialtiesData } = useSpecialties();
  const { data: doctorsData, loading: doctorsLoading } = useDoctors();

  const doctors = doctorsData || [];
  const specialties = specialtiesData || [];
  const featuredDoctors = doctors.slice(0, 4);

  function handleDoctorPress(doctorId: string) {
    router.push(`/doctor/${doctorId}`);
  }

  function handleSpecialtyPress(specialtyName: string) {
    router.push({
      pathname: '/search',
      params: { specialty: specialtyName },
    });
  }

  const getSpecialtyIcon = (name: string) => {
    const iconMap: Record<string, any> = {
      'Cardiologia': Heart,
      'Dermatologia': User,
      'Ortopedia': Bone,
      'Pediatria': Baby,
      'Neurologia': Brain,
      'Oftalmologia': Eye,
      'Ginecologia': User,
      'Psiquiatria': Brain,
    };
    return iconMap[name] || Stethoscope;
  };

  function handleBookDoctor(doctor: any) {
    const serviceId = doctor.services?.[0]?.id;
    const price = doctor.services?.[0]?.price || 200;

    if (!doctor.id || !serviceId) {
      router.push(`/doctor/${doctor.id}`);
      return;
    }

    router.push({
      pathname: '/booking',
      params: {
        doctorId: doctor.id,
        serviceId,
        price: price.toString(),
      },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {user?.name || 'Usuário'}</Text>

          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.light.textSecondary} />
            <TextInput
              placeholder="Buscar médicos..."
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <SlidersHorizontal size={20} color={Colors.light.primary} />
          </View>
        </View>

        {/* PROMO */}
        <LinearGradient colors={['#2D9A8C', '#238276']} style={styles.promoCard}>
          <Text style={styles.promoTitle}>Check-ups Regulares</Text>
          <TouchableOpacity style={styles.promoBtn} onPress={() => router.push('/search')}>
            <Text style={styles.promoBtnText}>Agendar Agora</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* SPECIALTIES */}
        {specialties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especialidades</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialtiesScroll}
            >
              {specialties.map((specialty) => {
                const IconComponent = getSpecialtyIcon(specialty.name);
                return (
                  <TouchableOpacity
                    key={specialty.id}
                    style={styles.specialtyCard}
                    onPress={() => handleSpecialtyPress(specialty.name)}
                  >
                    <View style={styles.specialtyIconContainer}>
                      <IconComponent size={28} color={Colors.light.primary} />
                    </View>
                    <Text style={styles.specialtyName} numberOfLines={2}>
                      {specialty.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* DOCTORS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médicos em Destaque</Text>

          {doctorsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando médicos...</Text>
            </View>
          ) : featuredDoctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum médico disponível no momento</Text>
            </View>
          ) : (
          <View style={styles.doctorsGrid}>
            {featuredDoctors.map((doctor) => (
              <TouchableOpacity 
                key={doctor.id} 
                style={styles.doctorCard}
                onPress={() => handleDoctorPress(doctor.id)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: doctor.avatar }} style={styles.doctorImage} />

                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName} numberOfLines={1}>{doctor.name}</Text>
                  <Text style={styles.doctorSpecialty} numberOfLines={1}>{doctor.specialty}</Text>

                  <View style={styles.doctorRating}>
                    <Star size={14} color="#FFA500" fill="#FFA500" />
                    <Text>{doctor.rating || 0}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleBookDoctor(doctor);
                    }}
                  >
                    <Text style={styles.bookBtnText}>Agendar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { padding: 20 },
  greeting: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  searchInput: { flex: 1 },
  promoCard: { marginHorizontal: 20, marginTop: 20, padding: 20, borderRadius: 16 },
  promoTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  promoBtn: {
    marginTop: 12,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  promoBtnText: { color: Colors.light.primary, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  doctorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  doctorCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  doctorImage: { height: 120 },
  doctorInfo: { padding: 12 },
  doctorName: { fontWeight: '700' },
  doctorSpecialty: { color: Colors.light.textSecondary },
  doctorRating: { flexDirection: 'row', gap: 4, marginVertical: 8 },
  bookBtn: {
    backgroundColor: Colors.light.primary,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontWeight: '600' },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  specialtiesScroll: {
    paddingRight: 20,
    gap: 12,
  },
  specialtyCard: {
    alignItems: 'center',
    marginRight: 20,
  },
  specialtyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  specialtyName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
    maxWidth: 80,
  },
});
