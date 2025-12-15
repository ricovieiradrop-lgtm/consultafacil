import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, User, FileText, CheckSquare } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { formatCPF, validateCPF, cleanCPF } from '@/lib/utils';

export default function CompleteProfileScreen() {
  const [fullName, setFullName] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { completeProfile } = useAuth();

  const handleCPFChange = (text: string) => {
    const formatted = formatCPF(text);
    setCpf(formatted);
  };

  const handleComplete = async () => {
    if (!fullName.trim()) {
      Alert.alert('Nome obrigatório', 'Por favor, digite seu nome completo.');
      return;
    }

    if (fullName.trim().split(' ').length < 2) {
      Alert.alert('Nome incompleto', 'Por favor, digite seu nome completo (nome e sobrenome).');
      return;
    }

    const cleanedCPF = cleanCPF(cpf);
    if (!validateCPF(cleanedCPF)) {
      Alert.alert('CPF inválido', 'Por favor, digite um CPF válido.');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(
        'Termos e Política',
        'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.'
      );
      return;
    }

    setIsLoading(true);
    
    try {
      await completeProfile({
        full_name: fullName.trim(),
        cpf: cleanedCPF,
      });
      
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      console.error('Erro ao completar perfil:', error);
      
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        Alert.alert(
          'CPF já cadastrado',
          'Este CPF já está cadastrado no sistema. Se você já tem uma conta, faça login.'
        );
      } else {
        Alert.alert(
          'Erro ao cadastrar',
          error.message || 'Não foi possível completar seu cadastro. Tente novamente.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2D9A8C', '#238276']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.main}>
                <View style={styles.iconContainer}>
                  <User size={40} color="#FFFFFF" />
                </View>
                
                <Text style={styles.title}>Complete seu cadastro</Text>
                <Text style={styles.subtitle}>
                  Para garantir a segurança e conformidade com a LGPD
                </Text>

                <View style={styles.formContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome completo</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Digite seu nome completo"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        editable={!isLoading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CPF</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="000.000.000-00"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={cpf}
                        onChangeText={handleCPFChange}
                        keyboardType="number-pad"
                        maxLength={14}
                        editable={!isLoading}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Seu CPF é protegido e não será compartilhado
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setAcceptedTerms(!acceptedTerms)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                      {acceptedTerms && <CheckSquare size={20} color="#2D9A8C" />}
                    </View>
                    <Text style={styles.checkboxText}>
                      Aceito os{' '}
                      <Text style={styles.link}>Termos de Uso</Text>
                      {' '}e a{' '}
                      <Text style={styles.link}>Política de Privacidade</Text>
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.infoBox}>
                    <FileText size={20} color="rgba(255, 255, 255, 0.9)" />
                    <Text style={styles.infoText}>
                      Seus dados são criptografados e protegidos conforme a Lei Geral de Proteção de Dados (LGPD).
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    (isLoading || !fullName || !cpf || !acceptedTerms) && styles.buttonDisabled
                  ]}
                  onPress={handleComplete}
                  activeOpacity={0.8}
                  disabled={isLoading || !fullName || !cpf || !acceptedTerms}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Cadastrando...' : 'Concluir cadastro'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  main: {
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 40,
    lineHeight: 24,
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
  },
  checkboxCheckedIcon: {
    color: '#2D9A8C',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  link: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  footer: {
    paddingTop: 24,
    paddingBottom: 24,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D9A8C',
  },
});
