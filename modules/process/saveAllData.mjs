import fsa from "fs/promises";
import path from "path";

export async function saveAllData(allCsgo, allDota, baseDir) {
  const csgoDir = path.join(baseDir, "csgo");
  const dotaDir = path.join(baseDir, "dota");

  await fsa.mkdir(csgoDir, { recursive: true });
  await fsa.mkdir(dotaDir, { recursive: true });

  const csgoMap = new Map();
  const dotaMap = new Map();

  for (const item of allCsgo) {
    const type = item.type ?? "UnknownType";
    const family = item.family ?? null;

    const key = family ? `${type}/${family}` : type;

    if (!csgoMap.has(key)) csgoMap.set(key, []);
    csgoMap.get(key).push(item);
  }

  for (const item of allDota) {
    const type = item.type ?? "UnknownType";

    const key = type;

    if (!dotaMap.has(key)) dotaMap.set(key, []);
    dotaMap.get(key).push(item);
  }

  // Write CSGO
  for (const [key, items] of csgoMap) {
    const [type, family] = key.split("/");

    const dir = family ? path.join(csgoDir, type) : csgoDir;
    await fsa.mkdir(dir, { recursive: true });

    const filePath = family
      ? path.join(dir, family + ".json")
      : path.join(dir, type + ".json");

    await fsa.writeFile(filePath, JSON.stringify(items, null, 2));
  }

  // Write DOTA
  for (const [key, items] of dotaMap) {
    const filePath = path.join(dotaDir, key + ".json");
    await fsa.writeFile(filePath, JSON.stringify(items, null, 2));
  }
}
