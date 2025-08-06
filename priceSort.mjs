import fsa from "fs/promises";
import path from "path";

async function priceSort(baseDir, sortValue) {
  // Получаем список элементов в текущей папке
  const entries = await fsa.readdir(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    const basePath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      // Рекурсивно заходим в папку
      await priceSort(basePath, sortValue);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      // Если это JSON файл
      try {
        const content = await fsa.readFile(basePath, "utf-8");
        let data = JSON.parse(content);

        // Если в файле массив — сортируем
        if (Array.isArray(data)) {
          data.sort(
            (a, b) =>
              (b.prices?.[sortValue] ?? b.prices.cheapest) -
              (a.prices?.[sortValue] ?? a.prices.cheapest)
          );
        }

        // Сохраняем в новую папку
        await fsa.writeFile(basePath, JSON.stringify(data, null, 2), "utf-8");
        console.log(`Файл отсортирован (${sortValue}): ${basePath}`);
      } catch (err) {
        console.error(`Ошибка обработки файла ${basePath}:`, err.message);
      }
    }
  }
}

const baseDir = "accounts";
const sortValue = "steam"; //steam, buff, cheapest

// Запуск
priceSort(baseDir, sortValue)
  .then(() => console.log("Сортировка завершена."))
  .catch(console.error);
