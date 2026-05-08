import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme/colors";
import { useContacts } from "../storage/ContactsContext";
import { Group, GROUP_LABELS, Side, SIDE_LABELS } from "../types/Contact";
import { PrimaryButton } from "../components/PrimaryButton";

type Props = NativeStackScreenProps<RootStackParamList, "Summary">;

export default function SummaryScreen({ navigation }: Props) {
  const { contacts } = useContacts();

  const stats = useMemo(() => {
    const total = contacts.length;
    const valid = contacts.filter((c) => !c.isInvalid).length;
    const invalid = contacts.filter((c) => c.isInvalid).length;
    const duplicates = contacts.filter((c) => c.isDuplicate).length;

    const bySide: Record<Side, number> = {
      groom: 0,
      bride: 0,
      both: 0,
      unknown: 0,
    };
    const byGroup: Record<Group, number> = {
      family: 0,
      friends: 0,
      work: 0,
      army: 0,
      other: 0,
    };
    for (const c of contacts) {
      bySide[c.side]++;
      byGroup[c.group]++;
    }

    return { total, valid, invalid, duplicates, bySide, byGroup };
  }, [contacts]);

  const sideColor = (s: Side) =>
    s === "groom"
      ? colors.groom
      : s === "bride"
        ? colors.bride
        : s === "both"
          ? colors.both
          : colors.unknown;

  const maxSide = Math.max(1, ...Object.values(stats.bySide));
  const maxGroup = Math.max(1, ...Object.values(stats.byGroup));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.bigStatsRow}>
        <BigStat label="סה״כ" value={stats.total} />
        <BigStat label="תקינים" value={stats.valid} color={colors.success} />
      </View>
      <View style={styles.bigStatsRow}>
        <BigStat
          label="כפולים"
          value={stats.duplicates}
          color={colors.warning}
          onPress={
            stats.duplicates > 0
              ? () => navigation.navigate("Contacts", { filter: "duplicates" })
              : undefined
          }
        />
        <BigStat
          label="שגויים"
          value={stats.invalid}
          color={colors.error}
          onPress={
            stats.invalid > 0
              ? () => navigation.navigate("Contacts", { filter: "invalid" })
              : undefined
          }
        />
      </View>

      <Text style={styles.sectionTitle}>פילוח לפי צד</Text>
      <View style={styles.card}>
        {(["groom", "bride", "both", "unknown"] as Side[]).map((s) => (
          <BarRow
            key={s}
            label={SIDE_LABELS[s]}
            value={stats.bySide[s]}
            max={maxSide}
            color={sideColor(s)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>פילוח לפי קבוצה</Text>
      <View style={styles.card}>
        {(["family", "friends", "work", "army", "other"] as Group[]).map(
          (g) => (
            <BarRow
              key={g}
              label={GROUP_LABELS[g]}
              value={stats.byGroup[g]}
              max={maxGroup}
              color={colors.primary}
            />
          ),
        )}
      </View>

      <PrimaryButton
        title="ייצוא לאקסל"
        icon="📤"
        onPress={() => navigation.navigate("Export")}
        style={{ marginTop: 16 }}
        disabled={stats.total === 0}
      />
    </ScrollView>
  );
}

function BigStat({
  label,
  value,
  color,
  onPress,
}: {
  label: string;
  value: number;
  color?: string;
  onPress?: () => void;
}) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.bigStat} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.bigStatValue, !!color && { color }]}>{value}</Text>
      <Text style={styles.bigStatLabel}>{label}</Text>
      {onPress && <Text style={styles.bigStatHint}>הצג ›</Text>}
    </Wrapper>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${value === 0 ? 0 : Math.max(pct, 4)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 30,
  },
  bigStatsRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  bigStat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bigStatValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  bigStatLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  bigStatHint: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 5,
    textAlign: "right",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barRow: {
    marginBottom: 10,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  barValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  barTrack: {
    height: 10,
    backgroundColor: colors.secondary,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
  },
});
