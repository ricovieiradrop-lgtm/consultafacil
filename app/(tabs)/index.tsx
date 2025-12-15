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
  MapPin, 
  Star,
  HeartPulse,
  ScanFace,
  Bone,
  Baby,
  Brain,
  Eye,
  User,
  BrainCircuit,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/user';
import { useSpecialties, useDoctors } from '@/lib/supabase-hooks';
import { specialties as mockSpecialties } from '@/mocks/specialties';
import { doctors as mockDoctors } from '@/mocks/doctors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

const SPECIALTY_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'heart-pulse': HeartPulse,
  'scan-face': ScanFace,
  'bone': Bone,
  'baby': Baby,
  'brain': Brain,
  'eye': Eye,
  'user': User,
  'brain-circuit': BrainCircuit,
  'heart': HeartPulse,
  'face': ScanFace,
  'skeleton': Bone,
  'child': Baby,
  'head': Brain,
  'glasses': Eye,
  'person': User,
  'mind': BrainCircuit,
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: specialtiesData } = useSpecialties();
  const { data: doctorsData } = useDoctors();

  const specialties = specialtiesData && specialtiesData.length > 0 ? specialtiesData : mockSpecialties;
  const doctors = doctorsData && doctorsData.length > 0 ? doctorsData : mockDoctors;
  
  const featuredDoctors = doctors.slice(0, 4);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.greeting}>Olá, {user?.name || 'Usuário'}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.location}>{user?.location || 'São Paulo, SP'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Search size={20} color={Colors.light.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar médicos, especialidades..."
                placeholderTextColor={Colors.light.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => router.push('/search')}
              />
            </View>
            <TouchableOpacity style={styles.filterBtn}>
              <SlidersHorizontal size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient
          colors={['#2D9A8C', '#238276']}
          style={styles.promoCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Check-ups Regulares</Text>
            <Text style={styles.promoText}>
              Monitore sua saúde com consultas preventivas
            </Text>
            <TouchableOpacity style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Agendar Agora</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop' }}
            style={styles.promoImage}
          />
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Especialidades</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesScroll}
          >
            {specialties.map((specialty) => {
              const IconComponent = SPECIALTY_ICONS[specialty.icon];
              return (
                <TouchableOpacity
                  key={specialty.id}
                  style={styles.specialtyCard}
                  onPress={() => router.push('/search')}
                >
                  <View style={styles.specialtyIcon}>
                    {IconComponent ? (
                      <IconComponent size={28} color={Colors.light.primary} />
                    ) : (
                      <HeartPulse size={28} color={Colors.light.primary} />
                    )}
                  </View>
                  <Text style={styles.specialtyName}>{specialty.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Médicos em Destaque</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.doctorsGrid}>
            {featuredDoctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorCard}
                onPress={() => router.push(`/doctor/${doctor.id}` as any)}
              >
                <Image source={{ uri: doctor.avatar }} style={styles.doctorImage} />
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    {doctor.name}
                  </Text>
                  <Text style={styles.doctorSpecialty} numberOfLines={1}>
                    {doctor.specialty}
                  </Text>
                  <View style={styles.doctorRating}>
                    <Star size={14} color="#FFA500" fill="#FFA500" />
                    <Text style={styles.ratingText}>{doctor.rating}</Text>
                    <Text style={styles.reviewCount}>({doctor.reviewCount})</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => router.push(`/doctor/${doctor.id}` as any)}
                  >
                    <Text style={styles.bookBtnText}>Agendar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.light.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.error,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCard: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  promoText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  promoBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  promoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  specialtiesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  specialtyCard: {
    width: 100,
    alignItems: 'center',
    gap: 8,
  },
  specialtyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  doctorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
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
  doctorImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.light.border,
  },
  doctorInfo: {
    padding: 12,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  doctorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  bookBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
