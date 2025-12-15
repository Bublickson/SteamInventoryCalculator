export async function fetchItemsDota(browser, steamId) {
  const page = await browser.newPage();
  const url = `https://api.pricempire.com/v3/inventory/public/items?query=${steamId}&provider=buff&appId=570`;

  try {
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    const json = await response.json();
    await page.close();

    return json.items.map((item) => {
      const {
        marketHashName,
        itemType,
        prices = {}, //use a default value, to avoid TypeError
      } = item;
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
  } catch (err) {
    await page.close();
    throw err;
  }
}
