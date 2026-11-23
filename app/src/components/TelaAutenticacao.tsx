import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, type ComponentRef, type ReactNode } from "react";
import { Image, Keyboard, KeyboardAvoidingView, ScrollView } from "react-native";

import { styles } from "@/styles";

const logo = require("../../assets/images/logo-habitare.png");

export function TelaAutenticacao({ children }: { children: ReactNode }) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    const assinatura = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => assinatura.remove();
  }, []);

  return (
    <KeyboardAvoidingView style={styles.loginScreen} behavior="padding">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.loginContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={logo} style={styles.logo} />
        {children}
      </ScrollView>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}
