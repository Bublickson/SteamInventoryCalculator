import fsa from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";

const steamIds = ["76561198246607476", "76561198359519930"];
const baseDirCs2 = path.join("accounts", "cs2");
const TotalAccountPrice = {
  steam: [],
  buff: [],
  cheapest: [],
};

async function fetchDataWithPuppeteer(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Установим User-Agent, как в браузере, чтобы выглядеть реалистично
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
  );

  // Открываем URL и ждем загрузки сети
  const response = await page.goto(url, { waitUntil: "networkidle2" });

  // Получаем тело ответа (если это JSON API)
  const data = await response.json();

  await browser.close();

  return data;
}

async function fetchItems(index) {
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
    console.error("Ошибка:", error.response?.status, error.message);
    return [];
  }
}

async function saveData(accountsData) {
  for (const item of accountsData) {
    const type = item.type ?? "UnknownType"; // Pistol
    const family = item.family ?? null; // Glock-18

    let dirPath; // Путь папки
    let filePath; // Путь файла

    if (family) {
      // Не у всех придметов есть значение family, у кейсов это есть только type = Container
      dirPath = path.join(baseDirCs2, type);
      filePath = path.join(dirPath, family + ".json");
      await fsa.mkdir(dirPath, { recursive: true });
    } else {
      filePath = path.join(baseDirCs2, type + ".json");
    }

    // Проверка: если файл уже есть — читаем и добавляем в массив
    let existingData = [];
    try {
      const content = await fsa.readFile(filePath, "utf-8");
      existingData = JSON.parse(content);
    } catch (err) {
      // файл не найден — игнорируем
    }

    // Добавляем новый элемент
    existingData.push(item);
    TotalAccountPrice.steam.push(item.prices.steam);
    TotalAccountPrice.buff.push(item.prices.buff);
    TotalAccountPrice.cheapest.push(item.prices.cheapest);

    // Сохраняем
    await fsa.writeFile(
      filePath,
      JSON.stringify(existingData, null, 2),
      "utf-8"
    );
    console.log(`Файл сохранён: ${filePath}`);
  }
}

async function makeSum(priceObj) {
  const filePath = path.join(baseDirCs2, "TotalAccountPrice.json");

  const sumSteam = priceObj.steam
    .filter((n) => typeof n === "number")
    .reduce((a, b) => a + b, 0);
  const sumBuff = priceObj.buff
    .filter((n) => typeof n === "number")
    .reduce((a, b) => a + b, 0);
  const sumCheapest = priceObj.cheapest
    .filter((n) => typeof n === "number")
    .reduce((a, b) => a + b, 0);

  const result = {
    Steam: +sumSteam.toFixed(2),
    Buff: +sumBuff.toFixed(2),
    Cheapest: +sumCheapest.toFixed(2),
  };

  await fsa.writeFile(filePath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`Файл суммы сохранён: ${filePath}`);
}

for (let i = 0; i < steamIds.length; i++) {
  await saveData(await fetchItems(i));
}

await makeSum(TotalAccountPrice);
