function goToCheck() {
    if (cleanedAddresses.length === 0) { 
        alert('Загрузите файл с адресами!'); 
        return; 
    }
    showTab('check');
    document.querySelectorAll('.tab-btn')[1].click();
}

async function startGeocoding() {
    if (cleanedAddresses.length === 0) { alert('Загрузите адреса!'); return; }
    
    results = [];
    currentIndex = 0;
    isRunning = true;
    
    showTab('result');
    document.querySelectorAll('.tab-btn')[2].click();
    document.getElementById('stopBtn').disabled = false;
    
    for (let i = 0; i < cleanedAddresses.length && isRunning; i++) {
        currentIndex = i;
        const cleaned = cleanedAddresses[i];
        
        let result = { lat: null, lon: null, status: 'empty', source: '' };
        if (cleaned.cleaned) {
            result = await geocode(cleaned.cleaned);
        }
        
        const baseLatEl = document.getElementById('baseLat');
        const baseLonEl = document.getElementById('baseLon');
        const coefEl = document.getElementById('coef');
        const baseLat = parseFloat(baseLatEl ? baseLatEl.value : '0');
        const baseLon = parseFloat(baseLonEl ? baseLonEl.value : '0');
        const coef = parseFloat(coefEl ? coefEl.value : '1') || 1;
        
        let distance = null;
        if (result.lat && result.lon && !isNaN(baseLat) && !isNaN(baseLon)) {
            const rawDist = haversineDistance(baseLat, baseLon, result.lat, result.lon) / 1000;
            distance = (rawDist * coef).toFixed(2);
        }
        
        const item = allAddresses[i];
        const originalAddr = typeof item === 'object' ? item.address : item;
        const itemName = typeof item === 'object' ? item.name : '';
        
        results.push({ 
            original: originalAddr, 
            cleaned: cleaned.cleaned, 
            searched: result.searched,
            lat: result.lat, 
            lon: result.lon, 
            status: result.status, 
            source: result.source,
            distance: distance,
            displayName: itemName || originalAddr
        });
        
        updateUI();
        await new Promise(r => setTimeout(r, CONFIG.delay));
    }
    
    currentIndex = cleanedAddresses.length;
    updateUI();
    finish();
}

document.getElementById('namesFileInput').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const namesFileInfo = document.getElementById('namesFileInfo');
    if (namesFileInfo) namesFileInfo.textContent = 'Загрузка: ' + file.name;
    
    try {
        loadedNamesFile = file;
        addressToNameMap = {};
        let parsedData = [];
        
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            jsonData.slice(1).forEach(row => {
                if (row.length >= 2) {
                    const name = String(row[0] || '').trim();
                    const address = String(row[1] || '').trim();
                    if (name && address && address.length > 3) {
                        parsedData.push({ name, address });
                        addressToNameMap[address] = name;
                    }
                }
            });
        } else {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(l => l.trim());
            
            lines.slice(1).forEach(l => {
                const idx = l.indexOf('\t');
                if (idx > 0) {
                    const name = l.substring(0, idx).trim();
                    const address = l.substring(idx + 1).trim();
                    if (name && address && address.length > 3) {
                        parsedData.push({ name, address });
                        addressToNameMap[address] = name;
                    }
                }
            });
        }
        
        allAddresses = parsedData;
        cleanedAddresses = allAddresses.map(item => cleanAddress(typeof item === 'object' ? item.address : item));
        
        if (allAddresses.length === 0) {
            const namesFileInfo = document.getElementById('namesFileInfo');
            if (namesFileInfo) namesFileInfo.innerHTML = '<span style="color:#e63946;">⚠ Файл не содержит строк с Tab-разделителем. Формат: Название + Tab + Адрес</span>';
            return;
        }
        
        const namesFileInfo = document.getElementById('namesFileInfo');
        if (namesFileInfo) namesFileInfo.innerHTML = `<span style="color:#2ec4b6;">✓</span> Загружено: ${allAddresses.length} адресов`;
        
        const changed = cleanedAddresses.filter(a => a.changes.length > 0).length;
        
        const countAllEl = document.getElementById('countAll');
        const countChangedEl = document.getElementById('countChanged');
        if (countAllEl) countAllEl.textContent = cleanedAddresses.length;
        if (countChangedEl) countChangedEl.textContent = changed;
        
        renderPreviewTable('all');
        showTab('check');
        document.querySelectorAll('.tab-btn')[1].click();
    } catch (err) {
        const namesFileInfo = document.getElementById('namesFileInfo');
        if (namesFileInfo) namesFileInfo.innerHTML = `<span style="color:#e63946;">⚠ Ошибка: ${err.message}</span>`;
        console.error('Ошибка загрузки:', err);
    }
});

function handleQuickSearch(query) {
    if (!query || query.length < 1) {
        const list = document.getElementById('autocompleteList');
        if (list) {
            list.innerHTML = '';
            list.classList.remove('show');
        }
        return;
    }
    const suggestions = getSuggestions(query);
    showSuggestions(suggestions, query);
}

const quickSearchInput = document.getElementById('quickSearch');
if (quickSearchInput) {
    quickSearchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addToRoute();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const list = document.getElementById('autocompleteList');
            const items = list.querySelectorAll('.autocomplete-item');
            if (items.length > 0) {
                selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
                items[selectedSuggestionIndex].classList.add('selected');
                items.forEach((item, i) => { if (i !== selectedSuggestionIndex) item.classList.remove('selected'); });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const list = document.getElementById('autocompleteList');
            const items = list.querySelectorAll('.autocomplete-item');
            if (items.length > 0) {
                selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
                items[selectedSuggestionIndex].classList.add('selected');
                items.forEach((item, i) => { if (i !== selectedSuggestionIndex) item.classList.remove('selected'); });
            }
        }
    });
}
