import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { estilosCampo } from "@/styles/campos-formulario";
import { colors } from "@/theme";

type CampoTextoProps = TextInputProps & {
  label: string;
  obrigatorio?: boolean;
};

export function CampoTexto({ label, obrigatorio, style, ...props }: CampoTextoProps) {
  return (
    <View style={estilosCampo.grupo}>
      <Text style={estilosCampo.rotulo}>
        {label}
        {obrigatorio ? <Text style={estilosCampo.obrigatorio}> *</Text> : null}
      </Text>
      <TextInput
        style={[estilosCampo.controle, estilosCampo.texto, styles.input, style]}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        underlineColorAndroid="transparent"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { textAlignVertical: "center" },
});
