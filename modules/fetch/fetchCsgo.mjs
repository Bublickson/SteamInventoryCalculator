export async function fetchItemsCsgo(browser, steamId) {
  const page = await browser.newPage();
  const url = `https://api.pricempire.com/v3/inventory/public/items?query=${steamId}&provider=buff&appId=730`;

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
        quality,
        family,
        prices = {}, //use a default value, to avoid TypeError
        type,
        stickers,
        inspectLink,
      } = item;
      const { cheapest, buff, steam } = prices;

      const pricesObj = {};
      if (steam != null) pricesObj.steam = +(steam * 0.01).toFixed(2);
      if (buff != null) pricesObj.buff = +(buff * 0.01).toFixed(2);
      if (cheapest != null) pricesObj.cheapest = +(cheapest * 0.01).toFixed(2);

      return {
        steamId,
        marketHashName,
        type,
        family,
        quality,
        prices: pricesObj,
        stickers:
          stickers?.map(({ price, wear, marketHashName }) => ({
            price: +(price * 0.01).toFixed(2),
            wear,
            marketHashName,
          })) ?? [],
        inspectLink,
      };
    });
  } catch (err) {
    await page.close();
    throw err;
  }
}
