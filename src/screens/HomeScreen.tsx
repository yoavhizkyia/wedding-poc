import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors } from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import { useContacts } from "../storage/ContactsContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { contacts } = useContacts();

  const stats = useMemo(() => {
    const total = contacts.length;
    const valid = contacts.filter((c) => !c.isInvalid).length;
    const duplicates = contacts.filter((c) => c.isDuplicate).length;
    const invalid = contacts.filter((c) => c.isInvalid).length;
    return { total, valid, duplicates, invalid };
  }, [contacts]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>💍</Text>
        <Text style={styles.heroTitle}>רשימת מוזמנים</Text>
        <Text style={styles.heroSubtitle}>
          נהל את אנשי הקשר לחתונה במקום אחד
        </Text>
      </View>

      <View style={styles.statsCard}>
        <Stat label="סה״כ" value={stats.total} />
        <Divider />
        <Stat label="תקינים" value={stats.valid} color={colors.success} />
        <Divider />
        <Stat label="כפולים" value={stats.duplicates} color={colors.warning} />
        <Divider />
        <Stat label="שגויים" value={stats.invalid} color={colors.error} />
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title="ייבוא אנשי קשר"
          icon="📥"
          onPress={() => navigation.navigate("Import")}
        />
        <PrimaryButton
          title={`צפייה ברשימה (${stats.total})`}
          icon="👥"
          variant="secondary"
          onPress={() => navigation.navigate("Contacts")}
          style={{ marginTop: 12 }}
        />
        <PrimaryButton
          title="סיכום ופילוחים"
          icon="📊"
          variant="secondary"
          onPress={() => navigation.navigate("Summary")}
          style={{ marginTop: 12 }}
        />
        <PrimaryButton
          title="ייצוא לאקסל ל-iPlan"
          icon="📤"
          variant="secondary"
          onPress={() => navigation.navigate("Export")}
          style={{ marginTop: 12 }}
        />
      </View>

      <View style={styles.privacyCard}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <Text style={styles.privacyText}>המידע נשמר רק במכשיר שלך</Text>
      </View>
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <View style={statStyles.wrap}>
      <Text style={[statStyles.value, !!color && { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={statStyles.divider} />;
}

const statStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
});

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 18,
  },
  heroEmoji: {
    fontSize: 56,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginTop: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: {
    marginTop: 6,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
    marginTop: 24,
  },
  privacyIcon: {
    fontSize: 18,
    marginEnd: 8,
  },
  privacyText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
