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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useUser } from '@/contexts/user';
import { useSpecialties, useDoctors } from '@/lib/supabase-hooks';

import { doctors as mockDoctors } from '@/mocks/doctors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  useSpecialties();
  const { data: doctorsData } = useDoctors();

  const doctors = doctorsData?.length ? doctorsData : mockDoctors;

  const featuredDoctors = doctors.slice(0, 4);

  function handleDoctorPress(doctorId: string) {
    router.push(`/doctor/${doctorId}`);
  }

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
          <TouchableOpacity style={styles.promoBtn}>
            <Text style={styles.promoBtnText}>Agendar Agora</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* DOCTORS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médicos em Destaque</Text>

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
  promoCard: { margin: 20, padding: 20, borderRadius: 16 },
  promoTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  promoBtn: {
    marginTop: 12,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  promoBtnText: { color: Colors.light.primary, fontWeight: '600' },
  section: { paddingHorizontal: 20 },
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
});
