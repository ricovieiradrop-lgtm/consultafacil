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
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
        <View style={styles.promoContainer}>
          <LinearGradient
            colors={['#0F766E', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoCard}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Check-ups{'\n'}Regulares</Text>
              <Text style={styles.promoSubtitle}>
                Monitore sua saúde com{'\n'}consultas preventivas
              </Text>
              <TouchableOpacity 
                style={styles.promoBtn} 
                onPress={() => router.push('/search')}
                activeOpacity={0.8}
              >
                <Text style={styles.promoBtnText}>Agendar Agora</Text>
              </TouchableOpacity>
            </View>
            
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop' }}
              style={styles.promoImage}
            />
          </LinearGradient>
        </View>

        {/* SPECIALTIES */}
        {specialties.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Especialidades</Text>
              <TouchableOpacity onPress={() => router.push('/search')}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Médicos em Destaque</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

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
  promoContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  promoCard: {
    borderRadius: 24,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    height: 160,
  },
  promoContent: {
    flex: 1,
    zIndex: 2,
    paddingRight: 10,
  },
  promoTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  promoSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  promoBtn: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  promoImage: {
    width: 120,
    height: 120,
    position: 'absolute',
    right: 12,
    top: 20,
    borderRadius: 0,
  },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAllText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  doctorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  doctorCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  scrollContent: {
    paddingBottom: 100,
  },
});
