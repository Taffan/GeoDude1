const CONFIG = {
    delay: 1100
};

let allAddresses = [];
let cleanedAddresses = [];
let results = [];
let isRunning = false;
let currentIndex = 0;
let currentFilter = 'all';
let addressToNameMap = {};
let loadedNamesFile = null;
let customMatrix = null;
let customMatrixNames = [];
let selectedSuggestionIndex = -1;

const TRANSLITERATE_MAP = {
    'й':'j','ц':'c','у':'k','е':'e','к':'r','н':'n','г':'g','ш':'sh','щ':'sch','з':'z','х':'h','ъ':'',
    'ф':'f','ы':'y','в':'v','а':'a','п':'p','р':'p','о':'o','л':'l','д':'d','ж':'zh','э':'e','я':'ya','ч':'ch','с':'s','м':'m','и':'i','т':'t','ь':'','б':'b','ю':'yu','ё':'yo',
    'Й':'J','Ц':'C','У':'K','Е':'E','К':'R','Н':'N','Г':'G','Ш':'SH','Щ':'SCH','З':'Z','Х':'H','Ъ':'',
    'Ф':'F','Ы':'Y','В':'V','А':'A','П':'P','Р':'P','О':'O','Л':'L','Д':'D','Ж':'ZH','Э':'E','Я':'YA','Ч':'CH','С':'S','М':'M','И':'I','Т':'T','Ь':'','Б':'B','Ю':'YU','Ё':'YO'
};
