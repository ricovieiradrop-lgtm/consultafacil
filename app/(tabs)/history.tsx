import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, CheckCircle, XCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

const MOCK_HISTORY = [
  {
    id: '1',
    doctorName: 'Dr. Paulo Oliveira',
    specialty: 'Neurologia',
    service: 'Consulta Neurológica',
    date: '2024-12-10',
    time: '14:30',
    status: 'completed' as const,
    price: 420,
  },
  {
    id: '2',
    doctorName: 'Dra. Maria Santos',
    specialty: 'Pediatria',
    service: 'Consulta Pediátrica',
    date: '2024-11-22',
    time: '09:00',
    status: 'completed' as const,
    price: 320,
  },
  {
    id: '3',
    doctorName: 'Dr. Roberto Costa',
    specialty: 'Ortopedia',
    service: 'Consulta Ortopédica',
    date: '2024-10-15',
    time: '16:00',
    status: 'cancelled' as const,
    price: 400,
  },
];

const FILTER_OPTIONS = ['Todas', 'Concluídas', 'Canceladas'];

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState('Todas');

  const filteredHistory = MOCK_HISTORY.filter((item) => {
    if (selectedFilter === 'Todas') return true;
    if (selectedFilter === 'Concluídas') return item.status === 'completed';
    if (selectedFilter === 'Canceladas') return item.status === 'cancelled';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
        style={styles.filtersContainer}
      >
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredHistory.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'completed'
                    ? styles.statusBadgeCompleted
                    : styles.statusBadgeCancelled,
                ]}
              >
                {item.status === 'completed' ? (
                  <CheckCircle size={14} color={Colors.light.success} />
                ) : (
                  <XCircle size={14} color={Colors.light.error} />
                )}
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'completed'
                      ? styles.statusTextCompleted
                      : styles.statusTextCancelled,
                  ]}
                >
                  {item.status === 'completed' ? 'Concluída' : 'Cancelada'}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </Text>
            </View>

            <Text style={styles.doctorName}>{item.doctorName}</Text>
            <Text style={styles.specialty}>{item.specialty}</Text>
            <Text style={styles.serviceName}>{item.service}</Text>

            <View style={styles.historyFooter}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Valor:</Text>
                <Text style={styles.priceValue}>
                  R$ {item.price.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewDetailsBtn}>
                <Text style={styles.viewDetailsText}>Ver Detalhes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={64} color={Colors.light.border} />
            <Text style={styles.emptyTitle}>Nenhum registro encontrado</Text>
            <Text style={styles.emptyText}>
              Suas consultas anteriores aparecerão aqui
            </Text>
          </View>
        )}
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
  filtersContainer: {
    maxHeight: 60,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  historyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusTextCompleted: {
    color: Colors.light.success,
  },
  statusTextCancelled: {
    color: Colors.light.error,
  },
  dateText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginBottom: 16,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  viewDetailsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    paddingHorizontal: 40,
  },
});
