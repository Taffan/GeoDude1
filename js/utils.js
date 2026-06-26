function transliterate(text) {
    return text.split('').map(ch => TRANSLITERATE_MAP[ch] || ch).join('');
}

const RU_TO_EN_MAP = {
    'й':'j','ц':'c','у':'k','е':'e','к':'r','н':'n','г':'g','ш':'sh','щ':'sch','з':'z','х':'h','ъ':'',
    'ф':'f','ы':'y','в':'v','а':'a','п':'p','р':'p','о':'o','л':'l','д':'d','ж':'zh','э':'e','я':'ya','ч':'ch','с':'s','м':'m','и':'i','т':'t','ь':'','б':'b','ю':'yu','ё':'yo',
    'Й':'J','Ц':'C','У':'K','Е':'E','К':'R','Н':'N','Г':'G','Ш':'SH','Щ':'SCH','З':'Z','Х':'H','Ъ':'',
    'Ф':'F','Ы':'Y','В':'V','А':'A','П':'P','Р':'P','О':'O','Л':'L','Д':'D','Ж':'ZH','Э':'E','Я':'YA','Ч':'CH','С':'S','М':'M','И':'I','Т':'T','Ь':'','Б':'B','Ю':'YU','Ё':'YO'
};

const EN_TO_RU_MAP = {
    'q':'й','w':'ц','e':'у','r':'е','t':'к','y':'н','u':'г','i':'ш','o':'щ','p':'з',
    'a':'ф','s':'ы','d':'в','f':'а','g':'п','h':'р','j':'о','k':'л','l':'д',
    'z':'ж','x':'э','c':'с','v':'с','b':'и','n':'т','m':'ь',
    '[':'х',']':'ъ',"'":"э",';':'б',',':'ю','.':'ю','/':'.',
    'Q':'Й','W':'Ц','E':'У','R':'Е','T':'К','Y':'Н','U':'Г','I':'Ш','O':'Щ','P':'З',
    'A':'Ф','S':'Ы','D':'В','F':'А','G':'П','H':'Р','J':'О','K':'Л','L':'Д',
    'Z':'Ж','X':'Э','C':'С','V':'С','B':'И','N':'Т','M':'Ь',
    '[':'Х',']':'Ъ',"'":"Э",';':'Б',',':'Ю','.':'Б','/':'.'
};

function enToRu(text) {
    return text.split('').map(ch => EN_TO_RU_MAP[ch] || ch).join('');
}

function searchNormalize(text) {
    return text.toLowerCase().trim();
}

function matchesQuery(name, query) {
    const n = searchNormalize(name);
    const q = searchNormalize(query);
    const qRu = searchNormalize(enToRu(query));
    const qEn = searchNormalize(transliterate(query));
    const qTranslit = searchNormalize(enToRu(transliterate(query)));
    
    return n.startsWith(q) || 
           n.startsWith(qRu) || 
           n.startsWith(qEn) || 
           n.startsWith(qTranslit);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function getBaseInfo() {
    const baseLat = parseFloat(document.getElementById('baseLat').value);
    const baseLon = parseFloat(document.getElementById('baseLon').value);
    const baseAddr = document.getElementById('baseAddress').value.trim();
    if (!isNaN(baseLat) && !isNaN(baseLon)) {
        return { lat: baseLat, lon: baseLon, name: baseAddr || `(${baseLat}, ${baseLon})` };
    }
    return null;
}

function getAllNames() {
    if (customMatrix && customMatrixNames.length > 0) {
        return customMatrixNames;
    }
    const found = results.filter(r => r.status === 'found');
    return found.map(r => r.displayName || r.original);
}

function highlightMatch(text, query) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx >= 0) {
        return escapeHtml(text.substring(0, idx)) + 
               '<mark>' + escapeHtml(text.substring(idx, idx + query.length)) + '</mark>' + 
               escapeHtml(text.substring(idx + query.length));
    }
    return escapeHtml(text);
}
