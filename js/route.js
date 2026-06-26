function getAllNames() {
    const names = [];
    
    if (typeof addressToNameMap !== 'undefined') {
        Object.values(addressToNameMap).forEach(name => {
            if (name && names.indexOf(name) === -1) {
                names.push(name);
            }
        });
    }
    
    if (typeof customMatrixNames !== 'undefined' && customMatrixNames.length > 0) {
        customMatrixNames.forEach(name => {
            if (name && names.indexOf(name) === -1) {
                names.push(name);
            }
        });
    }
    
    return names;
}

function getSuggestions(query) {
    const allNames = getAllNames();
    
    if (!query || query.length < 1) {
        const base = getBaseInfo();
        if (base) return ['📍 БАЗА'];
        return [];
    }
    
    if (query.length < 1) return [];
    
    const base = getBaseInfo();
    const qLower = query.toLowerCase().trim();
    const baseMatch = qLower === 'база' || qLower === 'baza' || 
                      qLower.startsWith('baz') || enToRu(qLower).startsWith('баз');
    
    const matches = allNames.filter(name => matchesQuery(name, query));
    const suggestions = matches.slice(0, 10);
    
    if (base && suggestions.indexOf('📍 БАЗА') === -1) {
        suggestions.unshift('📍 БАЗА');
    }
    
    return suggestions.slice(0, 12);
}

function showSuggestions(suggestions, query) {
    const list = document.getElementById('autocompleteList');
    if (!list) return;
    
    if (suggestions.length === 0) {
        list.innerHTML = '';
        list.classList.remove('show');
        selectedSuggestionIndex = -1;
        return;
    }
    
    let html = '';
    suggestions.forEach((name, i) => {
        html += `<div class="autocomplete-item" data-index="${i}" onclick="selectSuggestion(${i})" style="cursor:pointer;display:block;">${highlightMatch(name, query)}</div>`;
    });
    
    list.innerHTML = html;
    list.classList.add('show');
    selectedSuggestionIndex = -1;
}

function hideSuggestions() {
    document.getElementById('autocompleteList').classList.remove('show');
    selectedSuggestionIndex = -1;
}

function selectSuggestion(index) {
    const list = document.getElementById('autocompleteList');
    const items = list.querySelectorAll('.autocomplete-item');
    if (items[index]) {
        const name = items[index].textContent;
        addItemToRoute(name);
        document.getElementById('quickSearch').value = '';
        hideSuggestions();
    }
}

function addItemToRoute(name) {
    const routeInput = document.getElementById('routeInput');
    if (routeInput.value && !routeInput.value.endsWith('\n')) {
        routeInput.value += '\n';
    }
    routeInput.value += name;
}

function addToRoute() {
    const query = document.getElementById('quickSearch').value.trim();
    const list = document.getElementById('autocompleteList');
    const items = list.querySelectorAll('.autocomplete-item');
    
    let nameToAdd = query;
    if (items.length > 0) {
        if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
            nameToAdd = items[selectedSuggestionIndex].textContent;
        } else {
            nameToAdd = items[0].textContent;
        }
    }
    
    if (nameToAdd) {
        const base = getBaseInfo();
        const isBaseQuery = query.toLowerCase() === 'база' || query.toLowerCase() === 'baza' || 
                          transliterate(query).toLowerCase().startsWith('baz');
        
        if (isBaseQuery && base) {
            nameToAdd = '📍 БАЗА';
        }
        
        addItemToRoute(nameToAdd);
        document.getElementById('quickSearch').value = '';
        hideSuggestions();
    }
}

function loadCustomMatrix(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        customMatrix = jsonData.slice(1).map(row => row.slice(1).map(v => parseFloat(v) || 0));
        customMatrixNames = jsonData.slice(1).map(row => row[0] || '');
        
        document.getElementById('customMatrixInfo').innerHTML = 
            `<b style="color:#2ec4b6;">✓</b> Загружено: ${customMatrixNames.length} объектов | 
             <span style="cursor:pointer;color:#e63946;" onclick="clearMatrix()">Очистить</span>`;
    };
    reader.readAsArrayBuffer(file);
}

function clearMatrix() {
    customMatrix = null;
    customMatrixNames = [];
    document.getElementById('matrixFileInput').value = '';
    document.getElementById('customMatrixInfo').textContent = '';
}

function showRouteFromCustom() {
    const lines = document.getElementById('routeInput').value.split('\n').filter(l => l.trim());
    if (lines.length === 0) {
        alert('Введите названия в поле выше');
        return;
    }
    
    const firstSearch = lines[0].trim();
    let fromIdx = customMatrixNames.findIndex(n => n.toLowerCase() === firstSearch.toLowerCase());
    if (fromIdx < 0) {
        alert(`Не найден "${firstSearch}" в матрице`);
        return;
    }
    
    let html = '<table style="width:100%;border-collapse:collapse;">' +
        '<tr style="background:#f8f9fa;"><th style="padding:8px;">#</th><th style="padding:8px;">Откуда</th><th style="padding:8px;">Куда</th><th style="padding:8px;text-align:right;">км</th></tr>';
    
    let totalKm = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const search = lines[i].trim();
        const toIdx = customMatrixNames.findIndex(n => n.toLowerCase() === search.toLowerCase());
        
        if (toIdx >= 0 && toIdx !== fromIdx) {
            const dist = customMatrix[fromIdx][toIdx] || 0;
            totalKm += dist;
            html += `<tr><td style="padding:6px;">${i}</td><td style="padding:6px;">${escapeHtml(customMatrixNames[fromIdx])}</td><td style="padding:6px;">${escapeHtml(customMatrixNames[toIdx])}</td><td style="padding:6px;text-align:right;">${dist.toFixed(2)}</td></tr>`;
            fromIdx = toIdx;
        } else if (toIdx < 0) {
            html += `<tr style="background:#f8d7da;"><td style="padding:6px;">${i}</td><td style="padding:6px;color:#721c24;" colspan="2">${escapeHtml(search)} — не найден</td><td style="padding:6px;text-align:right;">-</td></tr>`;
        }
    }
    
    html += `<tr style="background:#d4edda;font-weight:bold;"><td colspan="3" style="padding:10px;">Итого:</td><td style="padding:10px;text-align:right;">${totalKm.toFixed(2)} км</td></tr></table>`;
    document.getElementById('routeResult').innerHTML = html;
}

function calculateRoute() {
    const lines = document.getElementById('routeInput').value.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
        alert('Введите минимум 2 адреса/названия');
        return;
    }
    
    if (customMatrix) {
        showRouteFromCustom();
        return;
    }
    
    const found = results.filter(r => r.status === 'found' && r.lat && r.lon);
    const base = getBaseInfo();
    if (found.length === 0 && !base) {
        alert('Сначала выполните геокодирование или загрузите матрицу');
        return;
    }
    
    const items = [];
    let totalKm = 0;
    let html = '<table style="width:100%;border-collapse:collapse;">' +
        '<tr style="background:#f8f9fa;"><th style="padding:8px;text-align:left;">#</th><th style="padding:8px;">Название</th><th style="padding:8px;">Адрес</th><th style="padding:8px;text-align:right;">км</th></tr>';
    
    for (let i = 0; i < lines.length; i++) {
        const search = lines[i].trim();
        
        if (search === '📍 БАЗА') {
            if (base) {
                const baseItem = { lat: base.lat, lon: base.lon, displayName: '📍 БАЗА', original: base.name };
                if (i === 0) {
                    html += `<tr><td style="padding:6px;">${i + 1}</td><td style="padding:6px;">📍 БАЗА</td><td style="padding:6px;font-size:12px;color:#888;">${escapeHtml(base.name)}</td><td style="padding:6px;text-align:right;">-</td></tr>`;
                } else {
                    const prev = items[i - 1];
                    const dist = haversineDistance(prev.lat, prev.lon, base.lat, base.lon) / 1000;
                    totalKm += dist;
                    html += `<tr><td style="padding:6px;">${i + 1}</td><td style="padding:6px;">📍 БАЗА</td><td style="padding:6px;font-size:12px;color:#888;">${escapeHtml(base.name)}</td><td style="padding:6px;text-align:right;">${dist.toFixed(2)}</td></tr>`;
                }
                items.push(baseItem);
            } else {
                html += `<tr style="background:#f8d7da;"><td style="padding:6px;">${i + 1}</td><td style="padding:6px;color:#721c24;">📍 БАЗА</td><td style="padding:6px;color:#721c24;">База не задана</td><td style="padding:6px;text-align:right;">-</td></tr>`;
            }
            continue;
        }
        
        const match = found.find(r => 
            (r.displayName && r.displayName.toLowerCase() === search.toLowerCase()) ||
            (r.original && r.original.toLowerCase().includes(search.toLowerCase()))
        );
        
        if (match && i > 0) {
            const prev = items[i - 1];
            const dist = haversineDistance(prev.lat, prev.lon, match.lat, match.lon) / 1000;
            totalKm += dist;
            html += `<tr><td style="padding:6px;">${i + 1}</td><td style="padding:6px;">${escapeHtml(match.displayName || '?')}</td><td style="padding:6px;font-size:12px;color:#888;">${escapeHtml(match.original.substring(0, 50))}</td><td style="padding:6px;text-align:right;">${dist.toFixed(2)}</td></tr>`;
            items.push(match);
        } else if (match) {
            html += `<tr><td style="padding:6px;">${i + 1}</td><td style="padding:6px;">${escapeHtml(match.displayName || '?')}</td><td style="padding:6px;font-size:12px;color:#888;">${escapeHtml(match.original.substring(0, 50))}</td><td style="padding:6px;text-align:right;">-</td></tr>`;
            items.push(match);
        } else {
            html += `<tr style="background:#f8d7da;"><td style="padding:6px;">${i + 1}</td><td style="padding:6px;color:#721c24;">${escapeHtml(search)}</td><td style="padding:6px;color:#721c24;">Не найден</td><td style="padding:6px;text-align:right;">-</td></tr>`;
        }
    }
    
    html += `<tr style="background:#d4edda;font-weight:bold;"><td colspan="3" style="padding:10px;">Итого:</td><td style="padding:10px;text-align:right;">${totalKm.toFixed(2)} км</td></tr></table>`;
    document.getElementById('routeResult').innerHTML = html;
}

function downloadRoute() {
    const lines = document.getElementById('routeInput').value.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
        alert('Введите минимум 2 адреса/названия');
        return;
    }
    
    if (customMatrix) {
        downloadRouteFromCustom();
        return;
    }
    
    const found = results.filter(r => r.status === 'found' && r.lat && r.lon);
    if (found.length < 2) {
        alert('Недостаточно данных для сохранения');
        return;
    }
    
    const routeItems = [];
    for (let i = 0; i < lines.length; i++) {
        const search = lines[i].trim();
        const match = found.find(r => 
            (r.displayName && r.displayName.toLowerCase() === search.toLowerCase()) ||
            (r.original && r.original.toLowerCase().includes(search.toLowerCase()))
        );
        if (match) routeItems.push(match);
    }
    
    if (routeItems.length < 2) {
        alert('В маршруте должно быть минимум 2 найденных объекта');
        return;
    }
    
    const headers = ['Название', 'Адрес', ...routeItems.map((r, i) => i + 1)];
    const data = routeItems.map((r1, i) => {
        const row = [r1.displayName || r1.original, r1.original];
        routeItems.forEach((r2, j) => {
            if (i === j) row.push(0);
            else {
                const dist = haversineDistance(r1.lat, r1.lon, r2.lat, r2.lon) / 1000;
                row.push(parseFloat(dist.toFixed(2)));
            }
        });
        return row;
    });
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Матрица');
    XLSX.writeFile(wb, `route_matrix_${Date.now()}.xlsx`);
}

function downloadRouteFromCustom() {
    const lines = document.getElementById('routeInput').value.split('\n').filter(l => l.trim());
    const firstSearch = lines[0].trim();
    let fromIdx = customMatrixNames.findIndex(n => n.toLowerCase() === firstSearch.toLowerCase());
    if (fromIdx < 0) {
        alert(`Не найден "${firstSearch}" в матрице`);
        return;
    }
    
    const routeIndices = [fromIdx];
    for (let i = 1; i < lines.length; i++) {
        const search = lines[i].trim();
        const toIdx = customMatrixNames.findIndex(n => n.toLowerCase() === search.toLowerCase());
        if (toIdx >= 0) routeIndices.push(toIdx);
    }
    
    if (routeIndices.length < 2) {
        alert('В маршруте должно быть минимум 2 найденных объекта');
        return;
    }
    
    const headers = ['Название', ...routeIndices.map((_, i) => i + 1)];
    const data = routeIndices.map((rowIdx, i) => {
        const row = [customMatrixNames[rowIdx]];
        routeIndices.forEach((colIdx, j) => {
            if (i === j) row.push(0);
            else row.push(customMatrix[rowIdx][colIdx] || 0);
        });
        return row;
    });
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Матрица');
    XLSX.writeFile(wb, `route_matrix_${Date.now()}.xlsx`);
}

function clearRoute() {
    document.getElementById('routeInput').value = '';
    document.getElementById('routeResult').innerHTML = '';
    document.getElementById('customMatrixInfo').textContent = '';
    document.getElementById('matrixFileInput').value = '';
    document.getElementById('quickSearch').value = '';
    customMatrix = null;
    customMatrixNames = [];
    hideSuggestions();
}
