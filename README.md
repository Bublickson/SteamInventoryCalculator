# SteamInventoryCalculator 🎮

SteamInventoryCalculator is a Node.js tool that fetches **public Steam inventories** for **CS:GO** and **Dota 2**, organizes items into structured folders, sorts them by price, and calculates the **total inventory value** across multiple marketplaces 📊

The project is designed for analysis and aggregation of a **large number of Steam accounts** simultaneously, making it suitable for bulk inventory evaluation and price analysis.

---

## 📦 Installation

```
npm install
```

Required dependencies:

* Node.js 18+
* puppeteer-extra
* puppeteer-extra-plugin-stealth

---

## 🚀 Features

* Fetches **CS:GO (AppID 730)** and **Dota 2 (AppID 570)** inventories
* Uses **public PriceEmpire API** as a price provider
* Supports multiple marketplaces:
  
  * **CS:GO:** Steam, Buff,
  * **Dota 2:** Skinport, DMarket,
  * **Both:** Cheapest (represents the estimated minimum market price)
* Concurrent inventory fetching for faster execution
* Automatically:

  * Groups items by type (and family for CS:GO)
  * Saves data into structured JSON files
  * Sorts items by selected price source
  * Calculates total account value

---

## ▶️ Usage

1. Add Steam IDs to `steamIds` array in `main.mjs`
2. Run the script:

```
npm start
```

3. Results will be saved in the `accounts/` directory

---

## 🛠 Configuration

### Change sorting price source

In `main.mjs`:

```js
await priceSort(folderPath, "steam", "skinport");
```

Available options:

* CS:GO: `steam`, `buff`, `cheapest`
* Dota 2: `skinport`, `dmarket`, `cheapest`

### Change concurrency

```js
runWorkers(taskFn, 20);
```

Increase or decrease depending on your system and network stability.

---

## ⚙️ How It Works

### 1️⃣ Fetching Inventories

* Uses **puppeteer**
* Fetches public inventory data via public PriceEmpire API
* Converts all prices from cents to currency values

### 2️⃣ Data Processing

* **CS:GO items** are grouped by:
  
  * **Pistols** (type) → **Glock-18** (family)

* **Dota 2 items** are grouped by:

  * **taunt** (type)

Each group is saved as a separate JSON file.

### 3️⃣ Sorting

All JSON files are sorted **descending by price**, using by defualt:

* CS:GO: `steam`
* Dota 2: `skinport`

Sorting is recursive and applies to all subfolders.

### 4️⃣ Price Summation

* Walks through all JSON files recursively
* Sums prices per marketplace
* Outputs a summary file:

```json
[
  "CSGO:",
  { "Steam": 1234.56, "Buff": 1000.32 },
  "Dota:",
  { "Skinport": 543.21, "DMarket": 498.76 }
]
```

---

## Notes

* Only **public Steam inventories** are supported
* API limits, availability, and price accuracy depend on PriceEmpire

---

## Disclaimer

This project is for **educational and analytical purposes only**.
It is not affiliated with Valve, Steam, or PriceEmpire.

---

## 📄 License

MIT License
