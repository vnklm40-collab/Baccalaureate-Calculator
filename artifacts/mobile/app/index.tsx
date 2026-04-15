import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";

type FieldKey =
  | "regional"
  | "continuous"
  | "math"
  | "physics"
  | "svt"
  | "philo"
  | "eng";

type Values = Record<FieldKey, string>;

type Result = {
  national: number;
  final: number;
  passed: boolean;
};

const initialValues: Values = {
  regional: "",
  continuous: "",
  math: "",
  physics: "",
  svt: "",
  philo: "",
  eng: "",
};

const nationalFields: Array<{
  key: FieldKey;
  label: string;
  coef: number;
}> = [
  { key: "math", label: "الرياضيات", coef: 7 },
  { key: "physics", label: "الفيزياء والكيمياء", coef: 7 },
  { key: "svt", label: "علوم الحياة والأرض", coef: 5 },
  { key: "philo", label: "الفلسفة", coef: 2 },
  { key: "eng", label: "الإنجليزية", coef: 2 },
];

const parseGrade = (value: string) => {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const formatAverage = (value: number) =>
  value.toLocaleString("ar-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function BacCalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<Values>(initialValues);
  const [result, setResult] = useState<Result | null>(null);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const nationalPreview = useMemo(() => {
    const filled = nationalFields.every((field) => parseGrade(values[field.key]) !== null);
    if (!filled) return null;
    const total = nationalFields.reduce(
      (sum, field) => sum + (parseGrade(values[field.key]) ?? 0) * field.coef,
      0,
    );
    return total / 23;
  }, [values]);

  const updateValue = (key: FieldKey, value: string) => {
    const cleaned = value.replace(/[^0-9.,]/g, "");
    setValues((current) => ({ ...current, [key]: cleaned }));
    setResult(null);
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    (Object.keys(values) as FieldKey[]).forEach((key) => {
      const grade = parseGrade(values[key]);
      if (grade === null) {
        nextErrors[key] = "أدخل نقطة صحيحة";
      } else if (grade < 0 || grade > 20) {
        nextErrors[key] = "النقطة يجب أن تكون بين 0 و20";
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const calculate = async () => {
    Keyboard.dismiss();
    if (!validate()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const regional = parseGrade(values.regional) ?? 0;
    const continuous = parseGrade(values.continuous) ?? 0;
    const national = nationalFields.reduce(
      (sum, field) => sum + (parseGrade(values[field.key]) ?? 0) * field.coef,
      0,
    ) / 23;
    const final = regional * 0.25 + continuous * 0.25 + national * 0.5;

    setResult({ national, final, passed: final >= 10 });
    await Haptics.notificationAsync(
      final >= 10
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
  };

  const reset = async () => {
    setValues(initialValues);
    setErrors({});
    setResult(null);
    await Haptics.selectionAsync();
  };

  const renderInput = (
    key: FieldKey,
    label: string,
    placeholder: string,
    coef?: number,
  ) => (
    <View key={key} style={styles.inputBlock}>
      <View style={styles.labelRow}>
        {coef ? (
          <View style={[styles.coefBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.coefText, { color: colors.secondaryForeground }]}>
              معامل {coef}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      </View>
      <TextInput
        value={values[key]}
        onChangeText={(text) => updateValue(key, text)}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType="decimal-pad"
        inputMode="decimal"
        returnKeyType="done"
        textAlign="right"
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: errors[key] ? colors.destructive : colors.input,
            color: colors.foreground,
          },
        ]}
        testID={`grade-${key}`}
      />
      {errors[key] ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{errors[key]}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 18),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 28),
          },
        ]}
        bottomOffset={88}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <View style={[styles.iconMarkLarge, { backgroundColor: colors.primaryForeground }]} />
            <View style={[styles.iconMarkSmall, { backgroundColor: colors.primaryForeground }]} />
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.kicker, { color: colors.accent }]}>علوم فيزيائية</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              حاسبة معدل الباكالوريا المغربية
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              أدخل نقط الجهوي والمراقبة والوطني، وسنحسب المعدل العام حسب النسب الرسمية.
            </Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>25%</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>الجهوي</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>25%</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>المراقبة</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>50%</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>الوطني</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الامتحان الجهوي</Text>
          {renderInput("regional", "معدل الجهوي النهائي", "مثال: 15.50")}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>المراقبة المستمرة</Text>
          {renderInput("continuous", "معدل المراقبة للدورتين", "مثال: 17.20")}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            {nationalPreview !== null ? (
              <Text style={[styles.previewValue, { color: colors.primary }]}>
                {formatAverage(nationalPreview)}
              </Text>
            ) : null}
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الامتحان الوطني</Text>
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                مجموع المعاملات: 23
              </Text>
            </View>
          </View>
          {nationalFields.map((field) => renderInput(field.key, field.label, "0.00", field.coef))}
        </View>

        <Pressable
          onPress={calculate}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
          ]}
          testID="calculate-button"
        >
          <View style={[styles.buttonDot, { backgroundColor: colors.primaryForeground }]} />
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            احسب المعدل العام
          </Text>
        </Pressable>

        <Pressable
          onPress={reset}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: colors.secondary,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          testID="reset-button"
        >
          <View style={[styles.buttonDotSmall, { backgroundColor: colors.secondaryForeground }]} />
          <Text style={[styles.secondaryButtonText, { color: colors.secondaryForeground }]}>
            مسح القيم
          </Text>
        </Pressable>

        {result ? (
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: result.passed ? colors.successBackground : colors.failBackground,
                borderColor: result.passed ? colors.success : colors.destructive,
              },
            ]}
            testID="result-card"
          >
            <View
              style={[
                styles.resultIcon,
                { backgroundColor: result.passed ? colors.success : colors.destructive },
              ]}
            >
              <View style={[styles.resultMark, { backgroundColor: colors.primaryForeground }]} />
            </View>
            <Text
              style={[
                styles.resultTitle,
                { color: result.passed ? colors.success : colors.destructive },
              ]}
            >
              {result.passed ? "مبارك النجاح" : "حظ أوفر في المرة القادمة"}
            </Text>
            <Text style={[styles.finalAverage, { color: colors.foreground }]}>
              {formatAverage(result.final)}
            </Text>
            <Text style={[styles.resultDetails, { color: colors.mutedForeground }]}>
              معدل الوطني: {formatAverage(result.national)}
            </Text>
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    gap: 16,
  },
  hero: {
    alignItems: "flex-end",
    gap: 16,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  iconMarkLarge: {
    width: 22,
    height: 8,
    borderRadius: 999,
    transform: [{ rotate: "-35deg" }],
  },
  iconMarkSmall: {
    width: 12,
    height: 8,
    borderRadius: 999,
    marginTop: -2,
    transform: [{ rotate: "35deg" }],
  },
  heroText: {
    alignItems: "flex-end",
    gap: 7,
  },
  kicker: {
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  title: {
    fontWeight: "700",
    fontSize: 30,
    lineHeight: 38,
    textAlign: "right",
  },
  subtitle: {
    fontWeight: "400",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "right",
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontWeight: "700",
    fontSize: 22,
  },
  summaryLabel: {
    fontWeight: "500",
    fontSize: 13,
  },
  summaryDivider: {
    width: 1,
    height: 36,
  },
  section: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 20,
    textAlign: "right",
  },
  sectionHint: {
    fontWeight: "400",
    fontSize: 13,
    marginTop: 4,
    textAlign: "right",
  },
  previewValue: {
    fontWeight: "700",
    fontSize: 18,
  },
  inputBlock: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontWeight: "600",
    fontSize: 15,
    textAlign: "right",
  },
  coefBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coefText: {
    fontWeight: "600",
    fontSize: 12,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontWeight: "600",
    fontSize: 18,
  },
  errorText: {
    fontWeight: "500",
    fontSize: 12,
    textAlign: "right",
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 5,
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 17,
  },
  buttonDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
  buttonDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  resultCard: {
    borderWidth: 1.5,
    borderRadius: 26,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  resultMark: {
    width: 24,
    height: 10,
    borderRadius: 999,
  },
  resultTitle: {
    fontWeight: "700",
    fontSize: 19,
    textAlign: "center",
  },
  finalAverage: {
    fontWeight: "700",
    fontSize: 44,
    lineHeight: 52,
  },
  resultDetails: {
    fontWeight: "500",
    fontSize: 14,
    textAlign: "center",
  },
});