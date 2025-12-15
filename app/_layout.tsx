import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/auth";
import { UserProvider } from "@/contexts/user";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { session, profile, isLoading, isOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'welcome' || 
                        segments[0] === 'phone-login' || 
                        segments[0] === 'verify-otp' || 
                        segments[0] === 'complete-profile';

    if (!session) {
      if (!inAuthGroup) {
        console.log('🔄 Navigation: No session, redirecting to welcome');
        router.replace('/welcome');
      }
    } else {
      if (isOnboarding || !profile) {
        if (segments[0] !== 'complete-profile') {
          console.log('🔄 Navigation: Onboarding needed, redirecting to complete-profile');
          router.replace('/complete-profile');
        }
      } else {
        if (inAuthGroup) {
          console.log('🔄 Navigation: Profile complete, redirecting based on role:', profile.role);
          if (profile.role === 'doctor') {
            router.replace('/doctor-dashboard');
          } else if (profile.role === 'admin') {
            router.replace('/admin-dashboard');
          } else {
            router.replace('/(tabs)');
          }
        }
      }
    }
  }, [session, profile, isLoading, isOnboarding, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Voltar" }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="phone-login" options={{ headerShown: false }} />
      <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
      
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="doctor-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </UserProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
