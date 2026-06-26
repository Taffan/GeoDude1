# 🗺️ GeoDude

Web application for geocoding addresses and route calculation.

## Project Structure

```
GeoDude/
├── index.html          # Main page
├── css/
│   └── styles.css      # Application styles
├── js/
│   ├── config.js       # Configuration and variables
│   ├── utils.js        # Utilities (transliteration, distance)
│   ├── geocoder.js     # Geocoding functions
│   ├── route.js        # Route calculation functions
│   ├── ui.js           # UI functions
│   └── app.js          # Main application logic
├── README.md           # Documentation (Russian)
└── README_en.md        # Documentation (English)
```

## Features

- 📁 Load addresses from file (.txt, .xlsx, .csv)
- 🔍 Automatic address cleaning and normalization
- 📍 Coordinate search via OSM (Nominatim, Photon)
- 📏 Distance calculation from base point
- 📐 Distance matrix generation
- 🚗 Route calculation
- 🔍 Quick search for objects
- 📥 Export results to Excel

## Input File Format

File with names and addresses separated by Tab:

```
Name      Address
Object 1  Region, District, City, Street 1
Object 2  Region2, District2, City2, Street 2
```

Supported formats:
- `.txt` — text file with Tab delimiter
- `.xlsx` — Excel
- `.csv` — CSV

## Usage

### Step 1: Load Data

1. Go to **📁 Load** tab
2. Load the file with addresses
3. If needed, set the base point for distance calculation

**Base point settings:**
- Enter address or coordinates (lat/lon)
- Set coefficient for real distance calculation (1.5 = +50%)

### Step 2: Check Addresses

1. View cleaned addresses
2. Green highlighted = modified addresses
3. Use filters: All / Modified / Unchanged

### Step 3: Geocoding

1. Click **🚀 Start Geocoding**
2. Wait for the process to complete
3. View results in real time

### Step 4: Results

- **📥 Download Excel** — save all results
- **📥 Not Found** — save list of unfound addresses
- **📐 Matrix** — save distance matrix

### Step 5: Route Calculation

**Option A: Load your own matrix**
1. Load matrix file (.xlsx)
2. Enter object names

**Option B: Use geocoding results**
1. Perform geocoding (step 3)
2. Use quick search or enter names manually

## Quick Search

The **🔍 Quick search** field allows you to:
- Search objects by first letters
- Works regardless of keyboard layout (rus/eng)
- Enter key adds object to route
- Up/Down arrows for navigation in list
- Type **база** or **baza** to add base point

## Distance Matrix Format (.xlsx)

```
        Object1  Object2  Object3
Object1    0       10       15
Object2   10        0        8
Object3   15        8        0
```

First column — object names.

## Interactive Tips

Click the **?** button in the bottom right corner to enable tips. Hover over an element to get a tip.

## Technologies

- HTML/CSS/JavaScript
- [SheetJS (xlsx)](https://sheetjs.com/) — Excel handling
- Nominatim API — geocoding
- Photon API — geocoding

## Author

[github.com/taffan](https://github.com/taffan)
