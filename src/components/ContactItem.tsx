import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Contact, SIDE_LABELS, GROUP_LABELS } from '../types/Contact';
import { colors } from '../theme/colors';
import { formatPhoneForDisplay } from '../utils/phoneNormalizer';

interface Props {
  contact: Contact;
  selected?: boolean;
  selectionMode?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
}

export function ContactItem({
  contact,
  selected,
  selectionMode,
  onPress,
  onLongPress,
  onToggleSelect,
}: Props) {
  const sideColor =
    contact.side === 'groom'
      ? colors.groom
      : contact.side === 'bride'
      ? colors.bride
      : contact.side === 'both'
      ? colors.both
      : colors.unknown;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
    >
      {selectionMode && (
        <TouchableOpacity onPress={onToggleSelect} style={styles.checkbox} hitSlop={10}>
          <View style={[styles.checkboxBox, selected && styles.checkboxBoxOn]}>
            {selected && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.sideBar, { backgroundColor: sideColor }]} />

      <View style={styles.body}>
        <View style={styles.line1}>
          <Text style={styles.name} numberOfLines={1}>
            {contact.fullName || `${contact.firstName} ${contact.lastName}`.trim() || '—'}
          </Text>
          <View style={styles.flagsRow}>
            {contact.isInvalid && (
              <View style={[styles.flag, { backgroundColor: colors.error }]}>
                <Text style={styles.flagText}>שגוי</Text>
              </View>
            )}
            {contact.isDuplicate && (
              <View style={[styles.flag, { backgroundColor: colors.warning }]}>
                <Text style={styles.flagText}>כפול</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.phone, contact.isInvalid && { color: colors.error }]}>
          {formatPhoneForDisplay(contact.phone) || 'אין מספר'}
        </Text>

        <View style={styles.line3}>
          <View style={[styles.tag, { backgroundColor: sideColor }]}>
            <Text style={styles.tagText}>{SIDE_LABELS[contact.side]}</Text>
          </View>
          <View style={[styles.tag, styles.tagGroup]}>
            <Text style={styles.tagTextDark}>{GROUP_LABELS[contact.group]}</Text>
          </View>
          {!!contact.notes && (
            <Text style={styles.notes} numberOfLines={1}>
              · {contact.notes}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  rowPressed: {
    opacity: 0.85,
  },
  checkbox: {
    paddingStart: 12,
    justifyContent: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxOn: {
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  sideBar: {
    width: 6,
  },
  body: {
    flex: 1,
    padding: 12,
  },
  line1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  flagsRow: {
    flexDirection: 'row',
  },
  flag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginStart: 6,
  },
  flagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  phone: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
  },
  line3: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginEnd: 6,
  },
  tagGroup: {
    backgroundColor: colors.secondary,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tagTextDark: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  notes: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
});
