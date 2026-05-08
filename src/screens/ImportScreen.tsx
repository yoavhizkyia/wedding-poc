import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { useContacts } from '../storage/ContactsContext';
import { Contact } from '../types/Contact';
import { isValidIsraeliMobile, normalizePhone, formatPhoneForDisplay } from '../utils/phoneNormalizer';
import { generateId } from '../utils/idGenerator';

type Props = NativeStackScreenProps<RootStackParamList, 'Import'>;

interface ImportableContact {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  isValid: boolean;
}

type PermissionState = 'unknown' | 'granted' | 'denied';

export default function ImportScreen({ navigation }: Props) {
  if (Platform.OS === 'web') {
    return <WebUnsupported onBack={() => navigation.goBack()} onAdd={() => navigation.navigate('Contacts')} />;
  }
  return <NativeImport navigation={navigation} />;
}

function WebUnsupported({ onBack, onAdd }: { onBack: () => void; onAdd: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.permEmoji}>📱</Text>
      <Text style={styles.permTitle}>ייבוא זמין רק במובייל</Text>
      <Text style={styles.permText}>
        הדפדפן אינו מאפשר גישה לאנשי הקשר במכשיר. לייבוא רשימה, פתחי את האפליקציה בטלפון.
        בגרסת הוויב ניתן להוסיף, לערוך, למחוק ולייצא רשימה.
      </Text>
      <PrimaryButton title="הוסיפי איש קשר ידנית" onPress={onAdd} style={{ marginTop: 18 }} />
      <PrimaryButton title="חזרה" variant="ghost" onPress={onBack} style={{ marginTop: 8 }} />
    </View>
  );
}

function NativeImport({ navigation }: Props) {
  const { addMany } = useContacts();
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [items, setItems] = useState<ImportableContact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [onlyValid, setOnlyValid] = useState(true);

  const requestAndLoad = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        setLoading(false);
        return;
      }
      setPermission('granted');

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
        ],
      });

      const flat: ImportableContact[] = [];
      for (const c of data) {
        const phones = c.phoneNumbers || [];
        if (phones.length === 0) continue;
        const firstName = c.firstName || '';
        const lastName = c.lastName || '';
        const fullName = c.name || `${firstName} ${lastName}`.trim();

        for (const p of phones) {
          const normalized = normalizePhone(p.number);
          if (!normalized) continue;
          flat.push({
            id: `${c.id}-${normalized}`,
            firstName,
            lastName,
            fullName,
            phone: normalized,
            isValid: isValidIsraeliMobile(normalized),
          });
        }
      }

      const seen = new Set<string>();
      const deduped = flat.filter((c) => {
        if (seen.has(c.phone)) return false;
        seen.add(c.phone);
        return true;
      });

      deduped.sort((a, b) => a.fullName.localeCompare(b.fullName, 'he'));
      setItems(deduped);
    } catch (e) {
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת אנשי הקשר');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestAndLoad();
  }, [requestAndLoad]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return items.filter((c) => {
      if (onlyValid && !c.isValid) return false;
      if (!q) return true;
      return c.fullName.includes(q) || c.phone.includes(q);
    });
  }, [items, search, onlyValid]);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of filtered) next.add(c.id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleImport = async () => {
    if (selected.size === 0) {
      Alert.alert('בחירה ריקה', 'יש לבחור לפחות איש קשר אחד');
      return;
    }

    setImporting(true);
    const toImport: Contact[] = items
      .filter((c) => selected.has(c.id))
      .map((c) => ({
        id: generateId(),
        fullName: c.fullName,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        side: 'unknown',
        group: 'other',
        notes: '',
        isSelected: false,
        isDuplicate: false,
        isInvalid: !c.isValid,
      }));

    const result = await addMany(toImport);
    setImporting(false);

    Alert.alert(
      'ייבוא הושלם',
      `נוספו: ${result.added}\nדולגו (כפולים): ${result.skipped}`,
      [{ text: 'אישור', onPress: () => navigation.navigate('Contacts') }]
    );
  };

  if (permission === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.permEmoji}>🔐</Text>
        <Text style={styles.permTitle}>אין הרשאה לאנשי קשר</Text>
        <Text style={styles.permText}>
          כדי לייבא אנשי קשר יש לאשר גישה בהגדרות המכשיר.
        </Text>
        <PrimaryButton title="נסה שוב" onPress={requestAndLoad} style={{ marginTop: 18 }} />
        <PrimaryButton
          title="חזור"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 8 }}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>טוען אנשי קשר...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="חיפוש לפי שם או טלפון"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          textAlign="right"
        />
      </View>

      <View style={styles.toolbar}>
        <Pressable
          onPress={() => setOnlyValid((v) => !v)}
          style={styles.checkboxWrap}
          hitSlop={6}
        >
          <View style={[styles.checkbox, onlyValid && styles.checkboxOn]}>
            {onlyValid && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>הצג רק נייד ישראלי תקין</Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={selectAllVisible} style={styles.linkBtn}>
          <Text style={styles.linkText}>בחר הכל ({filtered.length})</Text>
        </TouchableOpacity>
        {selected.size > 0 && (
          <TouchableOpacity onPress={clearSelection} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: colors.error }]}>נקה ({selected.size})</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingVertical: 6, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSel = selected.has(item.id);
          return (
            <Pressable onPress={() => toggleOne(item.id)} style={[styles.row, isSel && styles.rowSel]}>
              <View style={[styles.checkbox, isSel && styles.checkboxOn]}>
                {isSel && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <View style={{ flex: 1, marginStart: 12 }}>
                <Text style={styles.rowName}>{item.fullName || '—'}</Text>
                <Text style={[styles.rowPhone, !item.isValid && { color: colors.error }]}>
                  {formatPhoneForDisplay(item.phone)}
                  {!item.isValid && '  · לא נייד ישראלי'}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>לא נמצאו אנשי קשר</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <PrimaryButton
          title={selected.size > 0 ? `ייבא ${selected.size} אנשי קשר` : 'ייבא אנשי קשר'}
          onPress={handleImport}
          loading={importing}
          disabled={selected.size === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  permEmoji: {
    fontSize: 56,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  permText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 12,
  },
  searchRow: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  search: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  checkboxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
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
  checkboxLabel: {
    marginStart: 8,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  linkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSel: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  rowPhone: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
