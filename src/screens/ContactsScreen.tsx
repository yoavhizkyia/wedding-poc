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
import { Contact, GROUP_LABELS, Side, Group } from "../types/Contact";
import { ContactItem } from "../components/ContactItem";
import { ContactEditModal } from "../components/ContactEditModal";
import { Chip } from "../components/Chip";
import { BulkActionsBar } from "../components/BulkActionsBar";
import { normalizePhone } from "../utils/phoneNormalizer";
import { generateId } from "../utils/idGenerator";
import { PrimaryButton } from "../components/PrimaryButton";

type Props = NativeStackScreenProps<RootStackParamList, "Contacts">;

type SideFilter = "all" | "groom" | "bride" | "other";
type GroupFilter = Group | "all";
type FlagFilter = "all" | "invalid" | "duplicates";

function matchesSideFilter(side: Side, filter: SideFilter): boolean {
  if (filter === "all") return true;
  if (filter === "groom") return side === "groom";
  if (filter === "bride") return side === "bride";
  return side === "both" || side === "unknown";
}

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
      if (!matchesSideFilter(c.side, sideFilter)) return false;
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
    const counts = { groom: 0, bride: 0, other: 0 };
    for (const c of contacts) {
      if (c.side === "groom") counts.groom++;
      else if (c.side === "bride") counts.bride++;
      else counts.other++;
    }
    return counts;
  }, [contacts]);

  const groupCounts = useMemo(() => {
    const counts: Record<Group, number> = {
      family: 0,
      friends: 0,
      work: 0,
      army: 0,
      other: 0,
    };
    for (const c of contacts) counts[c.group]++;
    return counts;
  }, [contacts]);

  const filtersActive =
    flagFilter !== "all" || sideFilter !== "all" || groupFilter !== "all";

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

      <View style={styles.filtersBlock}>
        <View style={styles.statusRow}>
          <Chip
            compact
            label={`הכל · ${contacts.length}`}
            selected={!filtersActive}
            onPress={() => {
              setFlagFilter("all");
              setSideFilter("all");
              setGroupFilter("all");
            }}
          />
          <Chip
            compact
            label="שגויים"
            selected={flagFilter === "invalid"}
            onPress={() =>
              setFlagFilter(flagFilter === "invalid" ? "all" : "invalid")
            }
            color={colors.error}
            count={contacts.filter((c) => c.isInvalid).length}
          />
          <Chip
            compact
            label="כפולים"
            selected={flagFilter === "duplicates"}
            onPress={() =>
              setFlagFilter(flagFilter === "duplicates" ? "all" : "duplicates")
            }
            color={colors.warning}
            count={contacts.filter((c) => c.isDuplicate).length}
          />
        </View>

        <View style={styles.filterLine}>
          <Text style={styles.filterLabel}>צד</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            <Chip
              compact
              label="חתן"
              selected={sideFilter === "groom"}
              onPress={() =>
                setSideFilter(sideFilter === "groom" ? "all" : "groom")
              }
              color={colors.groom}
              count={sideCounts.groom}
            />
            <Chip
              compact
              label="כלה"
              selected={sideFilter === "bride"}
              onPress={() =>
                setSideFilter(sideFilter === "bride" ? "all" : "bride")
              }
              color={colors.bride}
              count={sideCounts.bride}
            />
            <Chip
              compact
              label="אחר"
              selected={sideFilter === "other"}
              onPress={() =>
                setSideFilter(sideFilter === "other" ? "all" : "other")
              }
              color={colors.both}
              count={sideCounts.other}
            />
          </ScrollView>
        </View>

        <View style={styles.filterLine}>
          <Text style={styles.filterLabel}>קרבה</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {(["family", "friends", "work", "army", "other"] as Group[]).map(
              (g) => (
                <Chip
                  key={g}
                  compact
                  label={GROUP_LABELS[g]}
                  selected={groupFilter === g}
                  onPress={() =>
                    setGroupFilter(groupFilter === g ? "all" : g)
                  }
                  count={groupCounts[g]}
                />
              ),
            )}
          </ScrollView>
        </View>
      </View>

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
  filtersBlock: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  filterLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  filterLabel: {
    width: 42,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "right",
    marginEnd: 4,
  },
  filterChips: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
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
