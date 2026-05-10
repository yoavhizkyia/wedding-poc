import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme/colors";
import { useContacts } from "../storage/ContactsContext";
import { Contact } from "../types/Contact";
import { PrimaryButton } from "../components/PrimaryButton";
import {
  hasCyrillic,
  transliterateRuToHe,
} from "../utils/cyrillicTransliterator";

type Props = NativeStackScreenProps<RootStackParamList, "Translate">;

function originalName(c: Contact): string {
  return c.fullName || `${c.firstName} ${c.lastName}`.trim();
}

export default function TranslateScreen({ navigation }: Props) {
  const { contacts, update } = useContacts();

  const candidates = useMemo(
    () =>
      contacts.filter(
        (c) =>
          hasCyrillic(c.fullName) ||
          hasCyrillic(c.firstName) ||
          hasCyrillic(c.lastName),
      ),
    [contacts],
  );

  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const candidatesKey = candidates.map((c) => c.id).join(",");

  useEffect(() => {
    setEdits((prev) => {
      const next = { ...prev };
      for (const c of candidates) {
        if (next[c.id] === undefined) {
          next[c.id] = transliterateRuToHe(originalName(c));
        }
      }
      return next;
    });
  }, [candidatesKey]);

  const setEdit = (id: string, value: string) => {
    setEdits((prev) => ({ ...prev, [id]: value }));
  };

  const resuggest = (c: Contact) => {
    setEdit(c.id, transliterateRuToHe(originalName(c)));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      let updated = 0;
      for (const c of candidates) {
        const newName = (edits[c.id] || "").trim();
        if (!newName || newName === originalName(c)) continue;
        const parts = newName.split(/\s+/);
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ");
        await update(c.id, { fullName: newName, firstName, lastName });
        updated++;
      }
      Alert.alert("הצלחה", `עודכנו ${updated} שמות`, [
        { text: "אישור", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  if (candidates.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🎉</Text>
        <Text style={styles.emptyTitle}>אין שמות בקיריליצה</Text>
        <Text style={styles.emptyText}>
          כל אנשי הקשר ברשימה כבר בעברית או באלפבית לטיני
        </Text>
        <PrimaryButton
          title="חזרה"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>
          {candidates.length} שמות לתרגום
        </Text>
        <Text style={styles.bannerHint}>
          ההצעה היא תעתיק אוטומטי - כדאי לעבור ולתקן לפני שמירה
        </Text>
      </View>

      <FlatList
        data={candidates}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 110 }}
        renderItem={({ item }) => {
          const original = originalName(item);
          const value = edits[item.id] ?? "";
          const isUnchanged = value.trim() === original;
          return (
            <View style={styles.card}>
              <View style={styles.originalRow}>
                <Text style={styles.originalLabel}>מקור:</Text>
                <Text style={styles.originalText} numberOfLines={1}>
                  {original}
                </Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  value={value}
                  onChangeText={(t) => setEdit(item.id, t)}
                  style={[styles.input, isUnchanged && styles.inputWarning]}
                  textAlign="right"
                  placeholder="שם בעברית"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  onPress={() => resuggest(item)}
                  style={styles.refreshBtn}
                  hitSlop={8}
                >
                  <Text style={styles.refreshText}>↻</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <PrimaryButton
          title={`שמור הכל (${candidates.length})`}
          onPress={handleSaveAll}
          loading={saving}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
  banner: {
    backgroundColor: colors.secondary,
    padding: 14,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
  },
  bannerHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  originalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  originalLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
    marginEnd: 6,
  },
  originalText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  inputWarning: {
    borderColor: colors.warning,
    backgroundColor: "#FFF7E6",
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginStart: 8,
  },
  refreshText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
