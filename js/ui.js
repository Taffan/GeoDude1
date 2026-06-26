function showHelp() { 
    document.getElementById('helpModal').style.display = 'block'; 
}

function closeHelp() { 
    document.getElementById('helpModal').style.display = 'none'; 
}

document.addEventListener('click', function(e) { 
    if (e.target.id === 'helpModal') closeHelp(); 
});

function toggleTips() {
    const btn = document.getElementById('tipBtn');
    const body = document.body;
    if (body.classList.contains('tips-on')) {
        body.classList.remove('tips-on');
        body.classList.add('tips-off');
        btn.classList.remove('active');
    } else {
        body.classList.remove('tips-off');
        body.classList.add('tips-on');
        btn.classList.add('active');
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(div => div.style.display = 'none');
    document.getElementById('tab-' + tabName).style.display = 'block';
    const btns = document.querySelectorAll('.tab-btn');
    const tabNames = ['load', 'check', 'result', 'route'];
    const idx = tabNames.indexOf(tabName);
    if (idx >= 0 && btns[idx]) btns[idx].classList.add('active');
}

function showRouteCalc() {
    showTab('route');
}

function renderPreviewTable(filter) {
    const tbody = document.getElementById('previewTable');
    tbody.innerHTML = '';
    
    let data = cleanedAddresses.map((c, i) => {
        const item = allAddresses[i];
        const originalAddr = typeof item === 'object' ? item.address : item;
        return { original: originalAddr, cleaned: c.cleaned, changes: c.changes, index: i + 1 };
    });
    
    if (filter === 'changed') data = data.filter(d => d.changes.length > 0);
    if (filter === 'unchanged') data = data.filter(d => d.changes.length === 0);
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        const hasChanges = item.changes.length > 0;
        tr.className = hasChanges ? 'highlight-green' : '';
        
        tr.innerHTML = `<td>${escapeHtml(item.cleaned)}</td>`;
        tbody.appendChild(tr);
    });
}

function filterAddresses(filter) {
    document.querySelectorAll('#tab-check .filter-btns .btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderPreviewTable(filter);
}

function updateUI() {
    const pct = cleanedAddresses.length > 0 ? Math.round((currentIndex / cleanedAddresses.length) * 100) : 0;
    const progressBar = document.getElementById('progressBar');
    const totalCount = document.getElementById('totalCount');
    const foundCountEl = document.getElementById('foundCount');
    const notFoundCountEl = document.getElementById('notFoundCount');
    
    if (progressBar) {
        progressBar.style.width = pct + '%';
        progressBar.textContent = pct + '%';
    }
    if (totalCount) totalCount.textContent = cleanedAddresses.length;
    
    const found = results.filter(r => r.status === 'found').length;
    const notFound = results.filter(r => r.status !== 'found').length;
    if (foundCountEl) foundCountEl.textContent = found;
    if (notFoundCountEl) notFoundCountEl.textContent = notFound;
    
    const resCountAll = document.getElementById('resCountAll');
    const resCountFound = document.getElementById('resCountFound');
    const resCountNotFound = document.getElementById('resCountNotFound');
    if (resCountAll) resCountAll.textContent = results.length;
    if (resCountFound) resCountFound.textContent = found;
    if (resCountNotFound) resCountNotFound.textContent = notFound;
    
    renderResultTable(currentFilter);
}

function renderResultTable(filter) {
    const tbody = document.getElementById('resultTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let data = results.map((r, i) => ({ ...r, index: i + 1 }));
    
    if (filter === 'found') data = data.filter(d => d.status === 'found');
    if (filter === 'notfound') data = data.filter(d => d.status !== 'found');
    
    const thead = tbody.closest('table').querySelector('thead');
    const thCount = thead ? thead.querySelectorAll('th').length : 6;
    
    data.forEach(item => {
        const tr = document.createElement('tr');
        const isFound = item.status === 'found';
        tr.className = isFound ? 'highlight-green' : 'highlight-red';
        
        if (thCount <= 2) {
            tr.innerHTML = `
                <td style="width:70%;">${escapeHtml(item.cleaned || item.original || '')}</td>
                <td style="text-align:right;white-space:nowrap;">${item.distance !== null ? item.distance + ' км' : '-'}</td>
            `;
        } else {
            const statusBadge = isFound 
                ? `<span class="badge badge-success">${item.source || 'OK'}</span>` 
                : `<span class="badge badge-danger">✗</span>`;
            
            tr.innerHTML = `
                <td>${item.index}</td>
                <td style="font-size:11px;color:#888;">${escapeHtml(item.displayName || item.original || '')}</td>
                <td>${escapeHtml(item.searched || item.cleaned || '')}</td>
                <td>${item.lat && item.lon ? `${item.lat.toFixed(6)}, ${item.lon.toFixed(6)}` : '-'}</td>
                <td style="text-align:center;">${item.distance !== null ? item.distance : '-'}</td>
                <td>${statusBadge}</td>
            `;
        }
        tbody.appendChild(tr);
    });
}

function filterResults(filter) {
    currentFilter = filter;
    document.querySelectorAll('#tab-result .filter-btns .btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderResultTable(filter);
}

function downloadResults() {
    const hasDistance = results.some(r => r.distance !== null);
    const headers = hasDistance ? ['Название', 'Адрес', 'lat', 'lon', 'distance km'] : ['Название', 'Адрес', 'lat', 'lon'];
    
    const data = results.map(r => {
        const name = r.displayName || '';
        const address = r.original || '';
        if (hasDistance) {
            return [name, address, r.lat || '', r.lon || '', r.distance !== null ? r.distance : ''];
        }
        return [name, address, r.lat || '', r.lon || ''];
    });
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Геокодирование');
    XLSX.writeFile(wb, `geocoded_${Date.now()}.xlsx`);
}

function downloadNotFound() {
    const notFound = results.filter(r => r.status !== 'found');
    if (notFound.length === 0) {
        alert('Нет ненайденных адресов');
        return;
    }
    
    const headers = ['Адрес'];
    const data = notFound.map(r => [r.original]);
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Не найденные');
    XLSX.writeFile(wb, `not_found_${Date.now()}.xlsx`);
}

function downloadDistanceMatrix() {
    const found = results.filter(r => r.status === 'found' && r.lat && r.lon);
    if (found.length < 2) {
        alert('Нужно минимум 2 найденных адреса');
        return;
    }
    
    const withNames = document.getElementById('matrixWithNames').checked;
    
    const headers = withNames 
        ? ['Название', ...found.map(r => r.displayName || r.original)]
        : ['Адрес', ...found.map(r => r.original)];
    
    const data = found.map((r1, i) => {
        const row = [withNames ? (r1.displayName || r1.original) : r1.original];
        found.forEach((r2, j) => {
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
    XLSX.writeFile(wb, `distance_matrix_${Date.now()}.xlsx`);
}

function stopGeocoding() {
    isRunning = false;
    document.getElementById('stopBtn').disabled = true;
    finish();
}

function finish() {
    isRunning = false;
    document.getElementById('stopBtn').disabled = true;
}

function applyNamesToResults() {
    if (!loadedNamesFile) {
        alert('Сначала загрузите таблицу с названиями');
        return;
    }
    
    let count = 0;
    results.forEach(r => {
        const name = addressToNameMap[r.original];
        if (name && (r.displayName === r.original || !r.displayName)) {
            r.displayName = name;
            count++;
        }
    });
    
    if (count > 0) {
        renderResultTable(currentFilter);
        alert(`Добавлено ${count} названий`);
    } else {
        alert('Названия уже применены');
    }
}
