import fsa from "fs/promises";
import path from "path";

async function priceSort(baseDir, sortedDir, sortKey, sortValue) {
  // Создаём папку назначения, если её нет
  await fsa.mkdir(sortedDir, { recursive: true });

  // Получаем список элементов в текущей папке
  const entries = await fsa.readdir(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    const basePath = path.join(baseDir, entry.name);
    const sortedPath = path.join(sortedDir, entry.name);

    if (entry.isDirectory()) {
      // Если это папка — рекурсивно заходим в неё
      await priceSort(basePath, sortedPath, sortKey, sortValue);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      // Если это JSON файл
      try {
        const content = await fsa.readFile(basePath, "utf-8");
        let data = JSON.parse(content);

        // Если в файле массив — сортируем
        if (Array.isArray(data)) {
          data.sort((a, b) => {
            const sumA = (a[sortKey] || []).reduce(
              (acc, sticker) => acc + (sticker[sortValue] || 0),
              0
            );
            const sumB = (b[sortKey] || []).reduce(
              (acc, sticker) => acc + (sticker[sortValue] || 0),
              0
            );
            return sumB - sumA;
          });
        }

        // Сохраняем в новую папку
        await fsa.writeFile(sortedPath, JSON.stringify(data, null, 2), "utf-8");
        console.log(`Файл отсортирован (${sortValue}): ${sortedPath}`);
      } catch (err) {
        console.error(`Ошибка обработки файла ${basePath}:`, err.message);
      }
    }
  }
}

const baseDirCs2 = path.join("accounts", "cs2");
const sortedDirCs2 = path.join("accounts_sorted", "cs2_stickers");
const sortKey = "stickers"; //stickers, prices
const sortValue = "price"; //price, steam

// Запуск
priceSort(baseDirCs2, sortedDirCs2, sortKey, sortValue)
  .then(() => console.log("Сортировка завершена."))
  .catch(console.error);
