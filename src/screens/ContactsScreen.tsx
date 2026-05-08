import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme/colors";
import { useContacts } from "../storage/ContactsContext";
import {
  Contact,
  GROUP_LABELS,
  SIDE_LABELS,
  Side,
  Group,
} from "../types/Contact";
import { ContactItem } from "../components/ContactItem";
import { ContactEditModal } from "../components/ContactEditModal";
import { Chip } from "../components/Chip";
import { BulkActionsBar } from "../components/BulkActionsBar";
import { normalizePhone } from "../utils/phoneNormalizer";
import { generateId } from "../utils/idGenerator";
import { PrimaryButton } from "../components/PrimaryButton";

type Props = NativeStackScreenProps<RootStackParamList, "Contacts">;

type SideFilter = Side | "all";
type GroupFilter = Group | "all";
type FlagFilter = "all" | "invalid" | "duplicates";

export default function ContactsScreen({ navigation, route }: Props) {
  const {
    contacts,
    addMany,
    update,
    remove,
    removeMany,
    bulkAssign,
    mergeIds,
  } = useContacts();

  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [flagFilter, setFlagFilter] = useState<FlagFilter>(
    route.params?.filter || "all",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Contact | null>(null);

  useEffect(() => {
    if (route.params?.filter) setFlagFilter(route.params.filter);
  }, [route.params?.filter]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleAddManual} hitSlop={10}>
          <Text
            style={{ color: colors.primary, fontSize: 16, fontWeight: "700" }}
          >
            + הוסף
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleAddManual = () => {
    const blank: Contact = {
      id: generateId(),
      fullName: "",
      firstName: "",
      lastName: "",
      phone: "",
      side: "unknown",
      group: "other",
      notes: "",
      isSelected: false,
      isDuplicate: false,
      isInvalid: true,
    };
    setEditing(blank);
  };

  const filtered = useMemo(() => {
    const q = search.trim();
    return contacts.filter((c) => {
      if (sideFilter !== "all" && c.side !== sideFilter) return false;
      if (groupFilter !== "all" && c.group !== groupFilter) return false;
      if (flagFilter === "invalid" && !c.isInvalid) return false;
      if (flagFilter === "duplicates" && !c.isDuplicate) return false;
      if (!q) return true;
      const inName = (
        c.fullName +
        " " +
        c.firstName +
        " " +
        c.lastName
      ).includes(q);
      const inPhone = normalizePhone(c.phone).includes(normalizePhone(q));
      return inName || inPhone;
    });
  }, [contacts, search, sideFilter, groupFilter, flagFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePressContact = (c: Contact) => {
    if (selected.size > 0) {
      toggleSelect(c.id);
    } else {
      setEditing(c);
    }
  };

  const handleSaveEdit = async (patch: Partial<Contact>) => {
    if (!editing) return;
    const exists = contacts.some((c) => c.id === editing.id);
    if (!exists) {
      const newContact: Contact = { ...editing, ...patch } as Contact;
      newContact.fullName =
        newContact.fullName ||
        `${newContact.firstName} ${newContact.lastName}`.trim();
      await addMany([newContact]);
    } else {
      await update(editing.id, patch);
    }
  };

  const canMerge = useMemo(() => {
    if (selected.size < 2) return false;
    const phones = new Set<string>();
    for (const id of selected) {
      const c = contacts.find((x) => x.id === id);
      if (!c) continue;
      const p = normalizePhone(c.phone);
      if (!p) return false;
      phones.add(p);
    }
    return phones.size === 1;
  }, [selected, contacts]);

  const handleMerge = () => {
    if (!canMerge) {
      Alert.alert("מיזוג", "ניתן למזג רק אנשי קשר עם אותו מספר טלפון מנורמל");
      return;
    }
    Alert.alert("מיזוג", `למזג ${selected.size} אנשי קשר לאחד?`, [
      { text: "ביטול", style: "cancel" },
      {
        text: "מזג",
        onPress: async () => {
          await mergeIds(Array.from(selected));
          setSelected(new Set());
        },
      },
    ]);
  };

  const sideCounts = useMemo(() => {
    const counts: Record<Side, number> = {
      groom: 0,
      bride: 0,
      both: 0,
      unknown: 0,
    };
    for (const c of contacts) counts[c.side]++;
    return counts;
  }, [contacts]);

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        <Chip
          label="הכל"
          selected={
            flagFilter === "all" &&
            sideFilter === "all" &&
            groupFilter === "all"
          }
          onPress={() => {
            setFlagFilter("all");
            setSideFilter("all");
            setGroupFilter("all");
          }}
          count={contacts.length}
        />
        <Chip
          label="שגויים"
          selected={flagFilter === "invalid"}
          onPress={() =>
            setFlagFilter(flagFilter === "invalid" ? "all" : "invalid")
          }
          color={colors.error}
          count={contacts.filter((c) => c.isInvalid).length}
        />
        <Chip
          label="כפולים"
          selected={flagFilter === "duplicates"}
          onPress={() =>
            setFlagFilter(flagFilter === "duplicates" ? "all" : "duplicates")
          }
          color={colors.warning}
          count={contacts.filter((c) => c.isDuplicate).length}
        />
        {(["groom", "bride", "both", "unknown"] as Side[]).map((s) => (
          <Chip
            key={s}
            label={SIDE_LABELS[s]}
            selected={sideFilter === s}
            onPress={() => setSideFilter(sideFilter === s ? "all" : s)}
            color={
              s === "groom"
                ? colors.groom
                : s === "bride"
                  ? colors.bride
                  : s === "both"
                    ? colors.both
                    : colors.unknown
            }
            count={sideCounts[s]}
          />
        ))}
        {(["family", "friends", "work", "army", "other"] as Group[]).map(
          (g) => (
            <Chip
              key={g}
              label={GROUP_LABELS[g]}
              selected={groupFilter === g}
              onPress={() => setGroupFilter(groupFilter === g ? "all" : g)}
            />
          ),
        )}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ContactItem
            contact={item}
            selected={selected.has(item.id)}
            selectionMode={selected.size > 0}
            onPress={() => handlePressContact(item)}
            onLongPress={() => toggleSelect(item.id)}
            onToggleSelect={() => toggleSelect(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>אין אנשי קשר</Text>
            <Text style={styles.emptyText}>
              ייבא אנשי קשר מהמכשיר או הוסף ידנית
            </Text>
            <PrimaryButton
              title="ייבא אנשי קשר"
              onPress={() => navigation.navigate("Import")}
              style={{ marginTop: 16 }}
            />
          </View>
        }
      />

      {selected.size > 0 && (
        <BulkActionsBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onDelete={async () => {
            await removeMany(Array.from(selected));
            setSelected(new Set());
          }}
          onAssign={async (patch) => {
            await bulkAssign(Array.from(selected), patch);
            setSelected(new Set());
          }}
          onMerge={handleMerge}
          canMerge={canMerge}
        />
      )}

      <ContactEditModal
        visible={!!editing}
        contact={editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
        onDelete={
          editing && contacts.some((c) => c.id === editing.id)
            ? async () => {
                if (editing) await remove(editing.id);
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  filtersRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  empty: {
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
});
