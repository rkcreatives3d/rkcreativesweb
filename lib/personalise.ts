// Options for personalised prints (keychains, nameplates): the lettering style
// and an optional icon after the name. Labels live here so the cart and the
// order message can describe them without loading any 3D code.

export const plateFonts = [
  { id: "bold", label: "Bold", note: "Clean block letters" },
  { id: "script", label: "Script", note: "Joined handwriting" },
  { id: "bubbly", label: "Bubbly", note: "Round and chunky" },
] as const;

export const plateIcons = [
  { id: "none", label: "None" },
  { id: "heart", label: "Heart" },
  { id: "star", label: "Star" },
  { id: "crown", label: "Crown" },
  { id: "paw", label: "Paw" },
  { id: "bolt", label: "Bolt" },
] as const;

export type PlateFont = (typeof plateFonts)[number]["id"];
export type PlateIcon = (typeof plateIcons)[number]["id"];
export type PlateOptions = { font?: PlateFont; icon?: PlateIcon };

/** e.g. "Script letters, heart icon"; empty for the defaults. */
export function optionsLabel(o?: PlateOptions) {
  if (!o) return "";
  const parts: string[] = [];
  if (o.font && o.font !== "bold") parts.push(`${plateFonts.find((f) => f.id === o.font)?.label} letters`);
  if (o.icon && o.icon !== "none") parts.push(`${plateIcons.find((i) => i.id === o.icon)?.label.toLowerCase()} icon`);
  return parts.join(", ");
}
