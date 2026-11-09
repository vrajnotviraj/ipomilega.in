/** Empty tile slots left when groups of these sizes fill rows of `cols`, in order: a group that does not fit starts a new row, a group wider than a row wraps inside itself. */
function emptySlots(sizes: number[], cols: number) {
  let empty = 0;
  let used = 0;
  for (const size of sizes) {
    const span = Math.min(size, cols);
    if (used + span > cols) {
      empty += cols - used;
      used = 0;
    }
    used += span;
    if (size > cols) empty += (cols - (size % cols)) % cols;
    if (used === cols) used = 0;
  }
  return empty + (used ? cols - used : 0);
}

/** 3 or 4 tiles a row on wide screens, whichever leaves fewer empty slots; 4 on a tie. */
export const desktopColumns = (sizes: number[]): 3 | 4 => (emptySlots(sizes, 3) < emptySlots(sizes, 4) ? 3 : 4);
