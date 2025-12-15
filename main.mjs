import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { fetchItemsCsgo } from "./modules/fetch/fetchCsgo.mjs";
import { fetchItemsDota } from "./modules/fetch/fetchDota.mjs";
import { saveAllData } from "./modules/process/saveAllData.mjs";
import { priceSort } from "./modules/process/priceSort.mjs";
import { priceSum } from "./modules/process/priceSum.mjs";

// Example Steam accounts
const steamIds = [
  "76561198055781755",
  "76561198373692482",
  "76561198174212473",
  "76561198274364392",
  "76561197960315522",
  "76561198032730078",
  "76561199020176549",
  "76561198801475475",
  "76561198305185709",
  "76561198426875315",
  "76561198140328362",
  "76561198036684395",
  "76561198389912800",
  "76561198101239627",
  "76561199831012502",
  "76561198191317871",
  "76561198104496716",
  "76561198041530549",
  "76561198073900734",
  "76561198423927882",
  "76561198045277210",
  "76561197988194057",
  "76561199260021447",
  "76561198116576268",
  "76561197969380246",
  "76561198407274025",
  "76561198358413771",
  "76561197961080670",
  "76561198976763061",
  "76561198256418487",
  "76561198077415988",
  "76561199018976014",
  "76561198842603734",
  "76561198035843637",
  "76561198171550670",
  "76561198320430286",
  "76561198246799686",
];

const folderPath = "accounts";

puppeteer.use(StealthPlugin());
const browser = await puppeteer.launch({ headless: true });

async function runWorkers(taskFn, concurrency) {
  let index = 0;

  async function worker() {
    while (index < steamIds.length) {
      const id = index++;
      await taskFn(id, index);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
}

const allCsgo = [];
const allDota = [];

async function main() {
  try {
    console.log("Fetching CSGO...");
    await runWorkers(async (id, index) => {
      showProgress(index, steamIds.length);
      const items = await fetchItemsCsgo(browser, steamIds[id]);
      allCsgo.push(...items);
    }, 20);

    console.log("\nFetching DOTA...");
    await runWorkers(async (id, index) => {
      showProgress(index, steamIds.length);
      const items = await fetchItemsDota(browser, steamIds[id]);
      allDota.push(...items);
    }, 20);

    console.log("\nSaving all data...");
    await saveAllData(allCsgo, allDota, folderPath);

    console.log("Sorting and Summarizing");
    await priceSort(folderPath, "steam", "skinport"); // Other parameters buff (csgo), dmarket (dota).

    await priceSum(folderPath);

    console.log("Done!");
  } catch (err) {
    console.error("\nCritical error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

function showProgress(current, total) {
  const percent = Math.floor((current / total) * 100);
  process.stdout.write(`\rProgress: ${percent}% (${current}/${total})`);
}

await main();
