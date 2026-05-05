import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { useContacts } from '../storage/ContactsContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { exportContactsToExcel } from '../utils/excelExporter';

type Props = NativeStackScreenProps<RootStackParamList, 'Export'>;

export default function ExportScreen({ navigation }: Props) {
  const { contacts } = useContacts();
  const [exporting, setExporting] = useState(false);
  const [excludeInvalid, setExcludeInvalid] = useState(true);
  const [excludeDuplicates, setExcludeDuplicates] = useState(false);

  const toExport = useMemo(() => {
    return contacts.filter((c) => {
      if (excludeInvalid && c.isInvalid) return false;
      if (excludeDuplicates && c.isDuplicate) return false;
      return true;
    });
  }, [contacts, excludeInvalid, excludeDuplicates]);

  const handleExport = async () => {
    if (toExport.length === 0) {
      Alert.alert('ייצוא', 'אין אנשי קשר לייצוא');
      return;
    }
    setExporting(true);
    const result = await exportContactsToExcel(toExport);
    setExporting(false);

    if (result.success) {
      Alert.alert('הצלחה', `יוצאו ${result.rowsExported} אנשי קשר`);
    } else {
      Alert.alert('שגיאה', result.error || 'שגיאה לא ידועה בייצוא');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerEmoji}>📊</Text>
        <Text style={styles.headerTitle}>ייצוא לאקסל</Text>
        <Text style={styles.headerSubtitle}>
          קובץ Excel מוכן לייבוא ל-iPlan עם עמודות בעברית מימין לשמאל
        </Text>
      </View>

      <Text style={styles.sectionTitle}>אפשרויות</Text>

      <Toggle
        label="אל תכלול מספרים שגויים"
        value={excludeInvalid}
        onToggle={() => setExcludeInvalid((v) => !v)}
      />
      <Toggle
        label="אל תכלול כפולים"
        value={excludeDuplicates}
        onToggle={() => setExcludeDuplicates((v) => !v)}
      />

      <Text style={styles.sectionTitle}>תצוגת עמודות</Text>
      <View style={styles.card}>
        <ColumnRow name="שם מלא" />
        <ColumnRow name="טלפון" />
        <ColumnRow name="צד" />
        <ColumnRow name="קבוצה" />
        <ColumnRow name="הערות" last />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryNumber}>{toExport.length}</Text>
        <Text style={styles.summaryLabel}>אנשי קשר יוצאו</Text>
        {toExport.length !== contacts.length && (
          <Text style={styles.summaryNote}>
            (מתוך {contacts.length} סה״כ ברשימה)
          </Text>
        )}
      </View>

      <PrimaryButton
        title="ייצא ושתף קובץ XLSX"
        icon="📤"
        onPress={handleExport}
        loading={exporting}
        disabled={toExport.length === 0}
      />

      <PrimaryButton
        title="חזרה"
        variant="ghost"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 8 }}
      />

      <View style={styles.privacyCard}>
        <Text style={styles.privacyText}>🔒 המידע נשמר רק במכשיר שלך</Text>
      </View>
    </ScrollView>
  );
}

function Toggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={styles.toggleRow} onPress={onToggle}>
      <View style={[styles.checkbox, value && styles.checkboxOn]}>
        {value && <Text style={styles.checkboxMark}>✓</Text>}
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

function ColumnRow({ name, last }: { name: string; last?: boolean }) {
  return (
    <View style={[styles.colRow, !last && styles.colRowBorder]}>
      <Text style={styles.colName}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 30,
  },
  headerCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'right',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    marginStart: 12,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  colRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  summaryNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
  },
  summaryNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  privacyCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
});
