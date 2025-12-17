import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Heart, Phone, Mail } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2D9A8C', '#238276', '#1D6B61']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Heart size={60} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <Text style={styles.title}>MedConnect</Text>
            <Text style={styles.subtitle}>Sua saúde em boas mãos</Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                Encontre médicos especializados perto de você
              </Text>
            </View>
            
            <View style={styles.feature}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                Agende consultas de forma rápida e segura
              </Text>
            </View>
            
            <View style={styles.feature}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>
                Acompanhe seu histórico médico completo
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/phone-login')}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Phone size={20} color="#2D9A8C" />
                <Text style={styles.buttonText}>Continuar com telefone</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => router.push('/email-login')}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Mail size={20} color="#FFFFFF" />
                <Text style={styles.buttonSecondaryText}>Continuar com e-mail</Text>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.terms}>
              Ao continuar, você concorda com nossos{'\n'}
              <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
              <Text style={styles.termsLink}>Política de Privacidade</Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500' as const,
  },
  featuresContainer: {
    gap: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2D9A8C',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  terms: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
  },
});
