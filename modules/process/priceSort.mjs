import fsa from "fs/promises";
import path from "path";

export async function priceSort(baseDir, sortValueCSGO, sortValueDota) {
  const entries = await fsa.readdir(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    const basePath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      await priceSort(basePath, sortValueCSGO, sortValueDota);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      try {
        const content = await fsa.readFile(basePath, "utf-8");
        let data = JSON.parse(content);

        if (!Array.isArray(data)) {
          data = [data];
        }

        if (data) {
          data.sort(
            (a, b) =>
              (b.prices?.[sortValueCSGO] ??
                b.prices?.[sortValueDota] ??
                b.prices?.cheapest ??
                0) -
              (a.prices?.[sortValueCSGO] ??
                a.prices?.[sortValueDota] ??
                a.prices?.cheapest ??
                0)
          );
        }

        await fsa.writeFile(basePath, JSON.stringify(data, null, 2), "utf-8");
      } catch (err) {
        console.error(`Error while sorting  ${basePath}:`, err.message);
      }
    }
  }
}
