import fsa from "fs/promises";
import path from "path";

async function sumPrices(folderPath) {
  const total = {
    steam: 0,
    buff: 0,
    skinport: 0,
    dmarket: 0,
  };

  const entries = await fsa.readdir(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      const subTotals = await sumPrices(fullPath);
      total.steam += subTotals.steam;
      total.buff += subTotals.buff;
      total.skinport += subTotals.skinport;
      total.dmarket += subTotals.dmarket;
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      const data = JSON.parse(await fsa.readFile(fullPath, "utf-8"));
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        const prices = item.prices || {};

        if (typeof prices.steam === "number") total.steam += prices.steam;
        if (typeof prices.buff === "number") total.buff += prices.buff;
        if (typeof prices.skinport === "number")
          total.skinport += prices.skinport;
        if (typeof prices.dmarket === "number") total.dmarket += prices.dmarket;
      }
    }
  }

  return total;
}

export async function priceSum(folder) {
  const totalSum = await sumPrices(folder);

  const resultCSGO = {
    Steam: +totalSum.steam.toFixed(2),
    Buff: +totalSum.buff.toFixed(2),
  };

  const resultDota = {
    Skinport: +totalSum.skinport.toFixed(2),
    DMarket: +totalSum.dmarket.toFixed(2),
  };

  const filePath = path.join(folder, "TotalAccountPrice.json");

  await fsa.writeFile(
    filePath,
    JSON.stringify(["CSGO:", resultCSGO, "Dota:", resultDota], null, 2),
    "utf-8"
  );

  console.log(`Sum file saved: ${filePath}`);
}
