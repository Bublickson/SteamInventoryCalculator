import fsa from "fs/promises";

const inputPath = "C:/Users/Alexander/Desktop/Account prices.txt"; //Вставить откуда читать
const outputPath = "C:/Users/Alexander/Desktop/Account prices sorted dota.txt"; //Вставитьк куда писать

const text = await fsa.readFile(inputPath, "utf8");

// Сплитим по строкам
const lines = text.split(/\r?\n/);

const parsed = [];
let current = {};

for (const line of lines) {
  const trimmed = line.trim();

  if (trimmed === "") continue;

  if (trimmed.startsWith("[")) {
    current = { id: trimmed.replace(/\[|\]/g, "") };
  } else if (trimmed.startsWith("CSGO:")) {
    const csgo = parseFloat(trimmed.split(":")[1]);
    if (!isNaN(csgo)) current.csgo = csgo;
  } else if (trimmed.startsWith("DOTA:")) {
    const dota = parseFloat(trimmed.split(":")[1]);
    if (!isNaN(dota)) current.dota = dota;
  }

  // если у нас уже есть все три поля — сохраняем
  if (current.id && current.csgo !== undefined && current.dota !== undefined) {
    parsed.push(current);
    current = {}; // обнуляем для следующего аккаунта
  }
}

if (parsed.length === 0) {
  console.log("❌ Не найдено ни одного корректного блока!");
} else {
  // Сортировка по DOTA по убыванию (для "csgo" b.csgo - a.csgo)
  parsed.sort((a, b) => b.dota - a.dota);
  console.log("✅ Найдено аккаунтов:", parsed.length);

  // Очищаем выходной файл
  await fsa.writeFile(outputPath, "");

  for (const acc of parsed) {
    await fsa.appendFile(
      outputPath,
      `[${acc.id}]\nCSGO: ${acc.csgo.toFixed(2)}\nDOTA: ${acc.dota.toFixed(
        2
      )}\n\n`,
      "utf-8"
    );
  }

  console.log("✅ Готово! Сортировка завершена.");
}
