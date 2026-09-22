import { StyleSheet } from "react-native";

export const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    width: 320,          // Largura fixa exata para ficarem rigorosamente iguais
    alignSelf: 'center', // Garante a centralização perfeita mesmo dentro do ScrollView
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    marginBottom: 14,
    borderRadius: 6,
    width: '100%',
    fontSize: 15,
    backgroundColor: '#fff',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
  },
});