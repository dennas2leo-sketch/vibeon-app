// Script para limpar AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearStorage() {
  try {
    await AsyncStorage.removeItem('vibeon_user');
    console.log('AsyncStorage cleared - vibeon_user removed');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}
