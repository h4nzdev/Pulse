import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import AppModal from "../components/AppModal";
import Header from "../components/Header";
import { FOLDER_COLORS, FOLDER_ICONS, IoniconName } from "../constants/categories";
import { useAlert } from "../contexts/AlertContext";
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatMoney } from "../utils/format";

export default function Folders() {
  const { colors, mode } = useTheme();
  const { expenses, profile, categories, addCategory, deleteCategory } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();
  const currency = profile?.currency ?? "$";

  const [createModal, setCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IoniconName>(FOLDER_ICONS[0]);
  const [colorIndex, setColorIndex] = useState(0);

  const folderData = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    for (const e of expenses) {
      if (e.type === "income") continue;
      const entry = (map[e.categoryId] ??= { count: 0, total: 0 });
      entry.count += 1;
      entry.total += e.amount;
    }
    return map;
  }, [expenses]);

  const openCreate = () => {
    setName("");
    setIcon(FOLDER_ICONS[0]);
    // suggest the next palette color based on how many custom folders exist
    setColorIndex((categories.length - 8) % FOLDER_COLORS.length);
    setCreateModal(true);
  };

  const saveFolder = () => {
    if (!name.trim()) {
      showAlert({ title: "Name your folder", message: "Give the folder a name first.", type: "warning" });
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      showAlert({ title: "Already exists", message: "A folder with that name already exists.", type: "warning" });
      return;
    }
    addCategory({
      name: name.trim(),
      icon,
      color: FOLDER_COLORS[colorIndex].color,
      colorDark: FOLDER_COLORS[colorIndex].colorDark,
    });
    setCreateModal(false);
    showAlert({ title: "Folder created", message: `"${name.trim()}" is ready to use.`, type: "success" });
  };

  const confirmDeleteFolder = (id: string, folderName: string) => {
    showAlert({
      title: "Delete folder?",
      message: `"${folderName}" will be removed. Its expenses move to the Other folder.`,
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteCategory(id) },
      ],
    });
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header
        title="Expense Folders"
        subtitle="All your spending, organized"
        showBack
        rightIcon="add"
        onRightPress={openCreate}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {categories.map((cat, i) => {
            const data = folderData[cat.id];
            const catColor = mode === "dark" ? cat.colorDark : cat.color;
            const isCustom = cat.id.startsWith("custom-");
            return (
              <Animated.View
                key={cat.id}
                entering={FadeInDown.delay(Math.min(i, 8) * 60).duration(350)}
                style={styles.cell}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(`/folder/${cat.id}`)}
                  onLongPress={
                    isCustom ? () => confirmDeleteFolder(cat.id, cat.name) : undefined
                  }
                  style={[
                    styles.folder,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {/* folder tab flap */}
                  <View style={[styles.flap, { backgroundColor: `${catColor}33` }]} />
                  <View style={[styles.folderBody, { backgroundColor: `${catColor}22` }]}>
                    <Ionicons name={cat.icon} size={28} color={catColor} />
                  </View>
                  <Text style={[styles.folderName, { color: colors.text }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={[styles.folderMeta, { color: colors.textMuted }]}>
                    {data ? `${data.count} item${data.count === 1 ? "" : "s"}` : "Empty"}
                    {isCustom ? " · custom" : ""}
                  </Text>
                  <Text style={[styles.folderTotal, { color: catColor }]}>
                    {formatMoney(data?.total ?? 0, currency)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* New folder tile */}
          <View style={styles.cell}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openCreate}
              style={[styles.newFolder, { borderColor: colors.primary }]}
            >
              <View style={[styles.newIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="add" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.newText, { color: colors.primary }]}>New folder</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Long-press a custom folder to delete it
        </Text>
      </ScrollView>

      {/* Create folder modal */}
      <AppModal visible={createModal} title="New folder" onClose={() => setCreateModal(false)}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Folder name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Pets, Travel, Coffee"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Icon</Text>
        <View style={styles.pickerGrid}>
          {FOLDER_ICONS.map((ic) => {
            const active = icon === ic;
            return (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={[
                  styles.iconOption,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceAlt,
                  },
                ]}
              >
                <Ionicons name={ic} size={20} color={active ? colors.onPrimary : colors.textSecondary} />
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Color</Text>
        <View style={styles.pickerGrid}>
          {FOLDER_COLORS.map((pair, i) => {
            const swatch = mode === "dark" ? pair.colorDark : pair.color;
            const active = colorIndex === i;
            return (
              <Pressable
                key={i}
                onPress={() => setColorIndex(i)}
                style={[
                  styles.colorOption,
                  { backgroundColor: swatch },
                  active && { borderWidth: 3, borderColor: colors.text },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          onPress={saveFolder}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="folder-open" size={18} color={colors.onPrimary} />
          <Text style={[styles.saveText, { color: colors.onPrimary }]}>Create folder</Text>
        </TouchableOpacity>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  cell: {
    width: "47.5%",
    flexGrow: 1,
  },
  folder: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    paddingTop: 18,
  },
  flap: {
    position: "absolute",
    top: 8,
    left: 14,
    width: 44,
    height: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  folderBody: {
    height: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  folderName: {
    fontSize: 14,
    fontWeight: "700",
  },
  folderMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  folderTotal: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
  },
  newFolder: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    padding: 14,
    minHeight: 148,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  newIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  newText: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  hint: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 16,
  },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
