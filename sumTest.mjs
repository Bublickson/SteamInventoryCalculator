import fs from "fs";
import path from "path";

// Рекурсивная функция для подсчета сумм
async function sumPrices(folderPath) {
  let total = 0;

  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Если папка — рекурсивно заходим внутрь
      total += await sumPrices(fullPath);
    } else if (file.endsWith(".json")) {
      // Читаем JSON файл
      const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

      // Проверяем, массив ли это
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.prices && typeof item.prices.cheapest === "number") {
            total += item.prices.cheapest;
          }
        }
      } else if (data.prices && typeof data.prices.cheapest === "number") {
        // Если это одиночный объект
        total += data.prices.cheapest;
      }
    }
  }

  return total;
}

// Использование:
(async () => {
  const folder = "./accounts"; // путь к вашей папке
  const totalSum = await sumPrices(folder);
  console.log("Общая сумма:", totalSum);
})();
