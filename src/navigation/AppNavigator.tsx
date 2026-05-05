import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ImportScreen from '../screens/ImportScreen';
import ContactsScreen from '../screens/ContactsScreen';
import SummaryScreen from '../screens/SummaryScreen';
import ExportScreen from '../screens/ExportScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Home: undefined;
  Import: undefined;
  Contacts: { filter?: 'invalid' | 'duplicates' } | undefined;
  Summary: undefined;
  Export: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
        headerBackTitle: 'חזור',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'רשימת מוזמנים' }} />
      <Stack.Screen name="Import" component={ImportScreen} options={{ title: 'ייבוא אנשי קשר' }} />
      <Stack.Screen name="Contacts" component={ContactsScreen} options={{ title: 'המוזמנים שלי' }} />
      <Stack.Screen name="Summary" component={SummaryScreen} options={{ title: 'סיכום' }} />
      <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'ייצוא לאקסל' }} />
    </Stack.Navigator>
  );
}
