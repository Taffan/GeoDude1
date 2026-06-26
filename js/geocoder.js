function cleanAddress(raw) {
    let addr = String(raw).trim();
    if (!addr || addr.length < 5) return { cleaned: '', changes: [] };
    
    const changes = [];
    const original = addr;
    
    addr = addr.replace(/^\d{6},?\s*/g, '');
    addr = addr.replace(/,+\s*$/g, '');
    addr = addr.replace(/\s*д\.\s*/gi, ' ');
    addr = addr.replace(/\s*дом\s*/gi, ' ');
    addr = addr.replace(/ул\s+\/\s+/gi, ' и ');
    addr = addr.replace(/\s+\/\s+(?!ул|про|пл|шос)/gi, ' и ');
    addr = addr.replace(/\s+\/\s*/g, ' ');
    addr = addr.replace(/\s+ул\s*/gi, ' улица');
    addr = addr.replace(/\s*\([^)]*\)\s*/g, ' ');
    
    const parts = addr.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    let keepLast = false;
    const filteredParts = parts.filter((p, i) => {
        const lower = p.toLowerCase();
        const isBad = lower.includes('пом') || lower.includes('квартира') || lower.includes('офис') || 
            lower.includes('комната') || lower.includes('этаж') || lower.includes('нежил') || 
            lower.includes('литер') || lower.includes('зд');
        
        if (isBad) return false;
        if (keepLast) return false;
        
        const nextIsBad = i + 1 < parts.length && (
            parts[i + 1].toLowerCase().includes('пом') || 
            parts[i + 1].toLowerCase().includes('квартира') ||
            parts[i + 1].toLowerCase().includes('этаж') ||
            parts[i + 1].toLowerCase().includes('офис') ||
            parts[i + 1].toLowerCase().includes('комната') ||
            parts[i + 1].toLowerCase().includes('нежил') ||
            parts[i + 1].toLowerCase().includes('литер') ||
            parts[i + 1].toLowerCase().includes('зд')
        );
        
        if (nextIsBad) keepLast = true;
        return true;
    });
    
    let result = filteredParts.join(', ');
    
    result = result.replace(/пр-кт/gi, 'проспект');
    result = result.replace(/пл-ка/gi, 'площадка');
    result = result.replace(/ш$/gi, 'шоссе');
    result = result.replace(/обл\./gi, 'область');
    result = result.replace(/р-н\./gi, 'район');
    result = result.replace(/\s+п\.\s*,/gi, ' посёлок,');
    result = result.replace(/\s+с\.\s*,/gi, ' село,');
    result = result.replace(/\s+г\.\s*,/gi, ' город,');
    result = result.replace(/обл\s+/gi, 'область ');
    result = result.replace(/р-н\s+/gi, 'район ');
    result = result.replace(/п\s+,/gi, ' посёлок,');
    result = result.replace(/с\s+,/gi, ' село,');
    result = result.replace(/г\s+,/gi, ' город,');
    result = result.replace(/,\s*,/g, ',');
    result = result.replace(/\s+/g, ' ');
    result = result.replace(/^\s+|\s+$/g, '');
    
    return { cleaned: result.trim().substring(0, 150), changes };
}

async function geocodeNominatim(address) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'GeocoderApp/1.0' } });
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), status: 'found', source: 'OSM' };
        }
    } catch (e) {}
    return { lat: null, lon: null, status: 'not_found', source: '' };
}

async function geocodePhoton(address) {
    try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const [lon, lat] = data.features[0].geometry.coordinates;
            return { lat, lon, status: 'found', source: 'Photon' };
        }
    } catch (e) {}
    return { lat: null, lon: null, status: 'not_found', source: '' };
}

async function geocode(address) {
    const simpler = address.replace(/область\s*/gi, '').replace(/обл\s*/gi, '').replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim();
    let result = { lat: null, lon: null, status: 'not_found', source: '', searched: address };
    
    result = await geocodePhoton(address);
    if (result.status === 'found') return { ...result, searched: address };
    result = await geocodeNominatim(address);
    if (result.status === 'found') return { ...result, searched: address };
    
    if (simpler !== address) {
        result = await geocodePhoton(simpler);
        if (result.status === 'found') return { ...result, searched: simpler };
        result = await geocodeNominatim(simpler);
        if (result.status === 'found') return { ...result, searched: simpler };
    }
    
    const noNumber = address.replace(/\s+\d+[а-яёa-z]*\s*$/gi, '').trim();
    if (noNumber !== address) {
        result = await geocodePhoton(noNumber);
        if (result.status === 'found') return { ...result, searched: noNumber };
        result = await geocodeNominatim(noNumber);
        if (result.status === 'found') return { ...result, searched: noNumber };
    }
    
    return { ...result, searched: address };
}

async function fillBaseCoords() {
    const baseAddress = document.getElementById('baseAddress');
    const baseLat = document.getElementById('baseLat');
    const baseLon = document.getElementById('baseLon');
    
    if (!baseAddress || !baseLat || !baseLon) return;
    
    const addr = baseAddress.value.trim();
    if (!addr) { alert('Введите адрес'); return; }
    
    const btn = document.querySelector('button[onclick="fillBaseCoords()"]');
    btn.disabled = true;
    btn.textContent = 'Ищу...';
    
    geocode(addr).then(result => {
        if (result.status === 'found') {
            baseLat.value = result.lat.toFixed(6);
            baseLon.value = result.lon.toFixed(6);
        } else {
            alert('Адрес не найден');
        }
        btn.disabled = false;
        btn.textContent = 'Найти координаты базы';
    }).catch(e => {
        alert('Ошибка: ' + e.message);
        btn.disabled = false;
        btn.textContent = 'Найти координаты базы';
    });
}
