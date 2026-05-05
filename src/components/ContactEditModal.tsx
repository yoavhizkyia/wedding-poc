import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Contact,
  Side,
  Group,
  SIDE_LABELS,
  GROUP_LABELS,
  SIDE_OPTIONS,
  GROUP_OPTIONS,
} from '../types/Contact';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';
import { Chip } from './Chip';
import { isValidIsraeliMobile, normalizePhone } from '../utils/phoneNormalizer';

interface Props {
  visible: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSave: (patch: Partial<Contact>) => void;
  onDelete?: () => void;
}

export function ContactEditModal({ visible, contact, onClose, onSave, onDelete }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [side, setSide] = useState<Side>('unknown');
  const [group, setGroup] = useState<Group>('other');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (contact) {
      setFirstName(contact.firstName);
      setLastName(contact.lastName);
      setPhone(contact.phone);
      setSide(contact.side);
      setGroup(contact.group);
      setNotes(contact.notes);
    }
  }, [contact]);

  const handleSave = () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const normalized = normalizePhone(phone);

    onSave({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      fullName,
      phone: normalized,
      side,
      group,
      notes: notes.trim(),
      isInvalid: !isValidIsraeliMobile(normalized),
    });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('מחיקת איש קשר', 'האם למחוק את איש הקשר?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => {
          onDelete?.();
          onClose();
        },
      },
    ]);
  };

  if (!contact) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>עריכת איש קשר</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>שם פרטי</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              textAlign="right"
              placeholder="שם פרטי"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>שם משפחה</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              textAlign="right"
              placeholder="שם משפחה"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>טלפון</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={[styles.input, !isValidIsraeliMobile(phone) && styles.inputError]}
              textAlign="right"
              keyboardType="phone-pad"
              placeholder="05X-XXXXXXX"
              placeholderTextColor={colors.textMuted}
            />
            {!isValidIsraeliMobile(phone) && (
              <Text style={styles.errorText}>מספר נייד ישראלי לא תקין</Text>
            )}

            <Text style={styles.label}>צד</Text>
            <View style={styles.chipsRow}>
              {SIDE_OPTIONS.map((s) => (
                <Chip
                  key={s}
                  label={SIDE_LABELS[s]}
                  selected={side === s}
                  onPress={() => setSide(s)}
                  color={
                    s === 'groom'
                      ? colors.groom
                      : s === 'bride'
                      ? colors.bride
                      : s === 'both'
                      ? colors.both
                      : colors.unknown
                  }
                />
              ))}
            </View>

            <Text style={styles.label}>קבוצה</Text>
            <View style={styles.chipsRow}>
              {GROUP_OPTIONS.map((g) => (
                <Chip
                  key={g}
                  label={GROUP_LABELS[g]}
                  selected={group === g}
                  onPress={() => setGroup(g)}
                />
              ))}
            </View>

            <Text style={styles.label}>הערות</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, styles.textArea]}
              textAlign="right"
              multiline
              numberOfLines={3}
              placeholder="הערות נוספות"
              placeholderTextColor={colors.textMuted}
            />

            <PrimaryButton title="שמור" onPress={handleSave} style={{ marginTop: 16 }} />

            {onDelete && (
              <PrimaryButton
                title="מחק איש קשר"
                onPress={handleDelete}
                variant="danger"
                style={{ marginTop: 10 }}
              />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
  },
  close: {
    fontSize: 22,
    color: colors.textMuted,
    paddingHorizontal: 6,
  },
  body: {
    padding: 18,
    paddingBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
