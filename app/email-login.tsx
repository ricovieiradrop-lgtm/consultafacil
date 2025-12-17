import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth';

export default function EmailLoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha email e senha.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Senha muito curta', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Email inválido', 'Por favor, insira um email válido.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        console.log('🔐 Email Login: Signing in with email', email);
        await signInWithEmail(email, password);
      } else {
        console.log('🔐 Email Login: Signing up with email', email);
        await signUpWithEmail(email, password);
        Alert.alert(
          'Conta criada!',
          'Verifique seu email para confirmar sua conta.'
        );
      }
    } catch (error: any) {
      console.error('❌ Email Login error:', error);
      
      let message = 'Não foi possível completar a operação. Tente novamente.';
      
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos.';
      } else if (error.message?.includes('User already registered')) {
        message = 'Este email já está cadastrado.';
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert(
        isLogin ? 'Erro ao entrar' : 'Erro ao cadastrar',
        message
      );
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
                <Mail size={40} color="#FFFFFF" />
              </View>
              
              <Text style={styles.title}>
                {isLogin ? 'Entrar' : 'Criar conta'}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin 
                  ? 'Digite seu email e senha para continuar'
                  : 'Preencha os dados para criar sua conta'
                }
              </Text>

              <View style={styles.inputsContainer}>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="rgba(255, 255, 255, 0.6)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Lock size={20} color="rgba(255, 255, 255, 0.6)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsLogin(!isLogin)}
                activeOpacity={0.7}
              >
                <Text style={styles.switchText}>
                  {isLogin 
                    ? 'Não tem conta? Cadastre-se'
                    : 'Já tem conta? Faça login'
                  }
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={isLoading || !email.trim() || !password.trim()}
              >
                <Text style={styles.buttonText}>
                  {isLoading 
                    ? (isLogin ? 'Entrando...' : 'Criando conta...') 
                    : (isLogin ? 'Entrar' : 'Criar conta')
                  }
                </Text>
              </TouchableOpacity>
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
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  switchButton: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textDecorationLine: 'underline' as const,
  },
  footer: {
    paddingBottom: 24,
    paddingTop: 16,
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
    fontWeight: '700' as const,
    color: '#2D9A8C',
  },
});
