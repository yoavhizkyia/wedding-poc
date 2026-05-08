import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { colors } from "../theme/colors";
import {
  Side,
  Group,
  SIDE_LABELS,
  GROUP_LABELS,
  SIDE_OPTIONS,
  GROUP_OPTIONS,
} from "../types/Contact";
import { PrimaryButton } from "./PrimaryButton";
import { Chip } from "./Chip";

interface Props {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onAssign: (patch: { side?: Side; group?: Group }) => void;
  onMerge?: () => void;
  canMerge?: boolean;
}

export function BulkActionsBar({
  count,
  onClear,
  onDelete,
  onAssign,
  onMerge,
  canMerge,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState<"side" | "group" | null>(null);
  const [side, setSide] = useState<Side | null>(null);
  const [group, setGroup] = useState<Group | null>(null);

  const handleApply = () => {
    if (pickerOpen === "side" && side) {
      onAssign({ side });
    } else if (pickerOpen === "group" && group) {
      onAssign({ group });
    }
    setPickerOpen(null);
    setSide(null);
    setGroup(null);
  };

  const handleDelete = () => {
    Alert.alert("מחיקה", `למחוק ${count} אנשי קשר?`, [
      { text: "ביטול", style: "cancel" },
      { text: "מחק", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onClear}
          style={styles.clearBtn}
          hitSlop={10}
        >
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.count}>נבחרו {count}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setPickerOpen("side")}
        >
          <Text style={styles.actionText}>צד</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setPickerOpen("group")}
        >
          <Text style={styles.actionText}>קבוצה</Text>
        </TouchableOpacity>
        {canMerge && onMerge && (
          <TouchableOpacity style={styles.actionBtn} onPress={onMerge}>
            <Text style={styles.actionText}>מזג</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionText, { color: "#fff" }]}>מחק</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={pickerOpen !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setPickerOpen(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {pickerOpen === "side" ? "בחר צד" : "בחר קבוצה"}
            </Text>
            <ScrollView
              contentContainerStyle={styles.chipWrap}
              horizontal={false}
            >
              <View style={styles.chipsRow}>
                {pickerOpen === "side" &&
                  SIDE_OPTIONS.map((s) => (
                    <Chip
                      key={s}
                      label={SIDE_LABELS[s]}
                      selected={side === s}
                      onPress={() => setSide(s)}
                      color={
                        s === "groom"
                          ? colors.groom
                          : s === "bride"
                            ? colors.bride
                            : s === "both"
                              ? colors.both
                              : colors.unknown
                      }
                    />
                  ))}
                {pickerOpen === "group" &&
                  GROUP_OPTIONS.map((g) => (
                    <Chip
                      key={g}
                      label={GROUP_LABELS[g]}
                      selected={group === g}
                      onPress={() => setGroup(g)}
                    />
                  ))}
              </View>
            </ScrollView>
            <PrimaryButton
              title="החל"
              onPress={handleApply}
              disabled={pickerOpen === "side" ? !side : !group}
              style={{ marginTop: 8 }}
            />
            <PrimaryButton
              title="ביטול"
              onPress={() => setPickerOpen(null)}
              variant="ghost"
              style={{ marginTop: 6 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearBtn: {
    paddingHorizontal: 8,
  },
  clearText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  count: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginStart: 6,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    marginStart: 6,
  },
  deleteBtn: {
    backgroundColor: colors.error,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    textAlign: "right",
  },
  chipWrap: {
    paddingVertical: 4,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
