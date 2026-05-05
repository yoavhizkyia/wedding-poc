import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../types/Contact';

const STORAGE_KEY = 'wedding.contacts.v1';

export async function loadContacts(): Promise<Contact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Contact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

export async function clearContacts(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
