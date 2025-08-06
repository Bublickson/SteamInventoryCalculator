import robot from "robotjs";
import clipboard from "clipboardy";
import fsa from "fs/promises";

const steamIds = [
  "76561198335140352",
  "76561198199994831",
  "76561198055592125",
];

const TotalAccountPrice = [];

robot.setKeyboardDelay(0); // задержка между нажатием и отпусканием клавиш
robot.setMouseDelay(0); // задержка между действиями мыши

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await delay(5000);

inventoryPricer();

async function accountError(accountIndex) {
  console.error(
    `На аккаунте ${steamIds[accountIndex]} в буфере пустое значение или только отступы!`
  );
}

async function writeAccountId(index) {
  await fsa.appendFile(
    "C:/Users/Alexander/Desktop/Test accounts.txt",
    `[${steamIds[index]}]\n`,
    "utf-8"
  );
}

async function writePrice(price, gamename) {
  await fsa.appendFile(
    "C:/Users/Alexander/Desktop/Test accounts.txt",
    `${gamename}: ${price}\n\n`,
    "utf-8"
  );
}

async function checkForPriceChange() {
  const currentClipboard = clipboard.readSync();
  return (
    typeof currentClipboard === "string" && currentClipboard.trim().length > 0
  );
}

async function fetchProfile() {
  robot.moveMouse(848, 294);
  robot.mouseClick();
  robot.keyTap("a", "control");
  robot.keyTap("v", "control");
  robot.moveMouse(1790, 296);
  robot.mouseClick();
}

async function takePrice(accountIndex) {
  for (let attempt = 0; attempt < 4; attempt++) {
    robot.moveMouse(627, 385);
    robot.mouseClick();
    robot.mouseClick();
    robot.keyTap("c", "control");
    await delay(200);

    const isValid = await checkForPriceChange();
    if (isValid) {
      const value = clipboard.readSync();
      TotalAccountPrice.push(value);
      return value;
    }

    console.log(`Попытка ${attempt + 1}: пустой буфер, обновляем страницу`);
    await delay(20000);
    robot.keyTap("f5");
    await delay(5000);
  }

  // Последняя проверка
  const finalClipboard = clipboard.readSync();
  if (
    typeof finalClipboard !== "string" ||
    finalClipboard.trim().length === 0
  ) {
    await accountError(accountIndex);
    return "Error";
  }

  TotalAccountPrice.push(finalClipboard);
  return finalClipboard;
}

async function changeToDota() {
  delay(1500);
  robot.moveMouse(1601, 284);
  robot.mouseClick();
  await delay(1000);
  robot.moveMouse(1598, 513);
  robot.mouseClick();
}

async function changeToCSGO() {
  robot.moveMouse(1601, 284);
  robot.mouseClick();
  await delay(1000);
  robot.moveMouse(1610, 347);
  robot.mouseClick();
}

async function makeSum() {
  const sum = TotalAccountPrice.reduce((acc, curr) => {
    const num = parseFloat(curr.replace(",", "."));
    if (isNaN(num)) {
      throw new Error(`Некорректное число: "${curr}"`);
    }
    return acc + num;
  }, 0);
  await writePrice(sum.toFixed(2), "totalSum");
  await writePrice((sum * 1.35).toFixed(2), "Steam Price With 15% sell fee");
}

async function inventoryPricer() {
  for (let i = 0; i < steamIds.length; i++) {
    clipboard.writeSync(steamIds[i]);
    await writeAccountId(i);
    await delay(2000);
    await fetchProfile();
    await delay(5000);
    await writePrice(await takePrice(i), "CSGO");
    await changeToDota();
    await delay(5000);
    await writePrice(await takePrice(i), "DOTA");
    await changeToCSGO();
  }
  await makeSum();
}

/* setTimeout(() => {
  const pos = robot.getMousePos();
  console.log(`x: ${pos.x}, y: ${pos.y}`);
}, 4000); */

/* 
1. Кординаты Search for an inventory =  x: 848, y: 294
2. Fetch = x: 1790, y: 296
3. Price = x: 627, y: 385
4. Game Change = x: 1601, y: 284
5. Dota 2 Change = = x: 1598, y: 513
6. CSGO Change = = x: 1610, y: 347
*/
