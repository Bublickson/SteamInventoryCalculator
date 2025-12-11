import fsa from "fs/promises";
import path from "path";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { priceSort } from "./priceSort.mjs";
import { priceSum } from "./sumTest.mjs";

const steamIds = ["76561198077199743"];
// Example Steam accounts

const folderPath = "accounts";

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({ headless: true });

async function fetchDataWithPuppeteer(url) {
  const page = await browser.newPage();

  const response = await page.goto(url, { waitUntil: "networkidle2" });

  const data = await response.json();

  await page.close();

  return data;
}

async function fetchItemsCsgo(index) {
  const steamId = steamIds[index];
  const url = `https://api.pricempire.com/v3/inventory/public/items?query=${steamId}&provider=buff&appId=730`;

  try {
    const response = await fetchDataWithPuppeteer(url);
    const items = response.items;
    return items.map(
      ({
        marketHashName,
        quality,
        family,
        prices = {},
        type,
        stickers,
        inspectLink,
      }) => {
        const { cheapest, buff, steam } = prices;

        const pricesObj = {};
        if (steam != null) pricesObj.steam = +(steam * 0.01).toFixed(2);
        if (buff != null) pricesObj.buff = +(buff * 0.01).toFixed(2);
        if (cheapest != null)
          pricesObj.cheapest = +(cheapest * 0.01).toFixed(2);

        return {
          steamId,
          marketHashName,
          type,
          family,
          quality,
          prices: pricesObj,
          stickers: stickers.map(({ price, wear, marketHashName }) => ({
            price: +(price * 0.01).toFixed(2),
            wear,
            marketHashName,
          })),
          inspectLink,
        };
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

async function fetchItemsDota(index) {
  const steamId = steamIds[index];
  const url = `https://api.pricempire.com/v3/inventory/public/items?query=${steamId}&provider=buff&appId=570`;

  try {
    const response = await fetchDataWithPuppeteer(url);
    const items = response.items;
    return items.map(({ marketHashName, itemType, prices = {} }) => {
      const { cheapest, dmarket, skinport } = prices;

      const pricesObj = {};
      if (skinport != null) pricesObj.skinport = +(skinport * 0.01).toFixed(2);
      if (dmarket != null) pricesObj.dmarket = +(dmarket * 0.01).toFixed(2);
      if (cheapest != null) pricesObj.cheapest = +(cheapest * 0.01).toFixed(2);

      return {
        steamId,
        marketHashName,
        type: itemType,
        prices: pricesObj,
      };
    });
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

async function saveData(accountsData, baseDir) {
  for (const item of accountsData) {
    const type = item.type ?? "UnknownType"; // Pistol
    const family = item.family ?? null; // Glock-18

    let dirPath;
    let filePath;

    if (family) {
      //Not all items have a family value. E.g for csgo-cases, exists only type (Container).
      dirPath = path.join(baseDir, type);
      filePath = path.join(dirPath, family + ".json");
      await fsa.mkdir(dirPath, { recursive: true });
    } else {
      filePath = path.join(baseDir, type + ".json");
    }

    let existingData = [];
    try {
      const content = await fsa.readFile(filePath, "utf-8");
      existingData = JSON.parse(content);
    } catch (err) {}

    existingData.push(item);

    await fsa.writeFile(
      filePath,
      JSON.stringify(existingData, null, 2),
      "utf-8"
    );
    console.log(`Saved: ${filePath}`);
  }
}

async function csgo() {
  const baseDir = path.join(folderPath, "csgo");
  await fsa.mkdir(baseDir, { recursive: true });
  for (let i = 0; i < steamIds.length; i++) {
    await saveData(await fetchItemsCsgo(i), baseDir);
  }
}

async function dota() {
  const baseDir = path.join(folderPath, "dota");
  await fsa.mkdir(baseDir, { recursive: true });
  for (let i = 0; i < steamIds.length; i++) {
    await saveData(await fetchItemsDota(i), baseDir);
  }
}

async function main() {
  try {
    // Select the games from which you want to get inventory data.
    await csgo();
    await dota();

    // steam (csgo) and skinport (dota) are the parameters by which your items will be sorted.
    // Other parameters buff (csgo), dmarket (dota).
    await priceSort(folderPath, "steam", "skinport");

    await priceSum(folderPath);
  } catch (err) {
    console.error("Critical error:", err);
  } finally {
    await browser.close();
  }
}

await main();
