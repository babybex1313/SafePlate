export type AllergenKey =
  | "wheat"
  | "dairy"
  | "eggs"
  | "peanuts"
  | "treeNuts"
  | "soy"
  | "fish"
  | "shellfish"
  | "sesame"
  | "mustard"
  | "sulfites"
  | "lupin"
  | "celery"
  | "molluscs";

export type LanguageKey =
  | "en"
  | "es"
  | "fr"
  | "it"
  | "de"
  | "pt"
  | "ja"
  | "zh"
  | "ko"
  | "th"
  | "el"
  | "ar"
  | "hi";

export interface AllergenInfo {
  key: AllergenKey;
  label: string;
  emoji: string;
}

export interface LanguageInfo {
  key: LanguageKey;
  nameEn: string;
  nativeName: string;
  flag: string;
}

export const ALLERGENS: AllergenInfo[] = [
  { key: "wheat", label: "Wheat / Gluten", emoji: "🌾" },
  { key: "dairy", label: "Dairy", emoji: "🥛" },
  { key: "eggs", label: "Eggs", emoji: "🥚" },
  { key: "peanuts", label: "Peanuts", emoji: "🥜" },
  { key: "treeNuts", label: "Tree Nuts", emoji: "🌰" },
  { key: "soy", label: "Soy", emoji: "🫘" },
  { key: "fish", label: "Fish", emoji: "🐟" },
  { key: "shellfish", label: "Shellfish", emoji: "🦐" },
  { key: "sesame", label: "Sesame", emoji: "🫗" },
  { key: "mustard", label: "Mustard", emoji: "🟡" },
  { key: "sulfites", label: "Sulfites", emoji: "🧪" },
  { key: "lupin", label: "Lupin", emoji: "🫘" },
  { key: "celery", label: "Celery", emoji: "🥬" },
  { key: "molluscs", label: "Molluscs", emoji: "🐙" },
];

export const LANGUAGES: LanguageInfo[] = [
  { key: "en", nameEn: "English", nativeName: "English", flag: "🇺🇸" },
  { key: "es", nameEn: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { key: "fr", nameEn: "French", nativeName: "Français", flag: "🇫🇷" },
  { key: "it", nameEn: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { key: "de", nameEn: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { key: "pt", nameEn: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { key: "ja", nameEn: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { key: "zh", nameEn: "Chinese (Mandarin)", nativeName: "中文", flag: "🇨🇳" },
  { key: "ko", nameEn: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { key: "th", nameEn: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { key: "el", nameEn: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { key: "ar", nameEn: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { key: "hi", nameEn: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
];

// Allergen names translated into each language
const allergenNames: Record<LanguageKey, Record<AllergenKey, string>> = {
  en: {
    wheat: "Wheat / Gluten",
    dairy: "Dairy",
    eggs: "Eggs",
    peanuts: "Peanuts",
    treeNuts: "Tree Nuts",
    soy: "Soy",
    fish: "Fish",
    shellfish: "Shellfish",
    sesame: "Sesame",
    mustard: "Mustard",
    sulfites: "Sulfites",
    lupin: "Lupin",
    celery: "Celery",
    molluscs: "Molluscs",
  },
  es: {
    wheat: "Trigo / Gluten",
    dairy: "Lácteos",
    eggs: "Huevos",
    peanuts: "Cacahuetes",
    treeNuts: "Frutos secos",
    soy: "Soja",
    fish: "Pescado",
    shellfish: "Mariscos",
    sesame: "Sésamo",
    mustard: "Mostaza",
    sulfites: "Sulfitos",
    lupin: "Altramuz",
    celery: "Apio",
    molluscs: "Moluscos",
  },
  fr: {
    wheat: "Blé / Gluten",
    dairy: "Produits laitiers",
    eggs: "Œufs",
    peanuts: "Arachides",
    treeNuts: "Fruits à coque",
    soy: "Soja",
    fish: "Poisson",
    shellfish: "Crustacés",
    sesame: "Sésame",
    mustard: "Moutarde",
    sulfites: "Sulfites",
    lupin: "Lupin",
    celery: "Céleri",
    molluscs: "Mollusques",
  },
  it: {
    wheat: "Grano / Glutine",
    dairy: "Latticini",
    eggs: "Uova",
    peanuts: "Arachidi",
    treeNuts: "Frutta a guscio",
    soy: "Soia",
    fish: "Pesce",
    shellfish: "Crostacei",
    sesame: "Sesamo",
    mustard: "Senape",
    sulfites: "Solfiti",
    lupin: "Lupino",
    celery: "Sedano",
    molluscs: "Molluschi",
  },
  de: {
    wheat: "Weizen / Gluten",
    dairy: "Milchprodukte",
    eggs: "Eier",
    peanuts: "Erdnüsse",
    treeNuts: "Schalenfrüchte",
    soy: "Soja",
    fish: "Fisch",
    shellfish: "Krustentiere",
    sesame: "Sesam",
    mustard: "Senf",
    sulfites: "Sulfite",
    lupin: "Lupine",
    celery: "Sellerie",
    molluscs: "Weichtiere",
  },
  pt: {
    wheat: "Trigo / Glúten",
    dairy: "Laticínios",
    eggs: "Ovos",
    peanuts: "Amendoins",
    treeNuts: "Frutos de casca rija",
    soy: "Soja",
    fish: "Peixe",
    shellfish: "Mariscos",
    sesame: "Sésamo",
    mustard: "Mostarda",
    sulfites: "Sulfitos",
    lupin: "Tremoço",
    celery: "Aipo",
    molluscs: "Moluscos",
  },
  ja: {
    wheat: "小麦・グルテン",
    dairy: "乳製品",
    eggs: "卵",
    peanuts: "ピーナッツ",
    treeNuts: "ナッツ類",
    soy: "大豆",
    fish: "魚",
    shellfish: "甲殻類",
    sesame: "ごま",
    mustard: "マスタード",
    sulfites: "亜硫酸塩",
    lupin: "ルピナス",
    celery: "セロリ",
    molluscs: "軟体動物",
  },
  zh: {
    wheat: "小麦/麸质",
    dairy: "乳制品",
    eggs: "鸡蛋",
    peanuts: "花生",
    treeNuts: "坚果",
    soy: "大豆",
    fish: "鱼类",
    shellfish: "贝类",
    sesame: "芝麻",
    mustard: "芥末",
    sulfites: "亚硫酸盐",
    lupin: "羽扇豆",
    celery: "芹菜",
    molluscs: "软体动物",
  },
  ko: {
    wheat: "밀/글루텐",
    dairy: "유제품",
    eggs: "계란",
    peanuts: "땅콩",
    treeNuts: "견과류",
    soy: "대두",
    fish: "생선",
    shellfish: "갑각류",
    sesame: "참깨",
    mustard: "겨자",
    sulfites: "아황산염",
    lupin: "루핀",
    celery: "셀러리",
    molluscs: "연체동물",
  },
  th: {
    wheat: "ข้าวสาลี/กลูเตน",
    dairy: "ผลิตภัณฑ์นม",
    eggs: "ไข่",
    peanuts: "ถั่วลิสง",
    treeNuts: "ถั่วเปลือกแข็ง",
    soy: "ถั่วเหลือง",
    fish: "ปลา",
    shellfish: "สัตว์มีเปลือก",
    sesame: "งา",
    mustard: "มัสตาร์ด",
    sulfites: "ซัลไฟต์",
    lupin: "ลูปิน",
    celery: "ขึ้นฉ่าย",
    molluscs: "หอย",
  },
  el: {
    wheat: "Σιτάρι/Γλουτένη",
    dairy: "Γαλακτοκομικά",
    eggs: "Αυγά",
    peanuts: "Φιστίκια",
    treeNuts: "Ξηροί καρποί",
    soy: "Σόγια",
    fish: "Ψάρια",
    shellfish: "Οστρακοειδή",
    sesame: "Σουσάμι",
    mustard: "Μουστάρδα",
    sulfites: "Θειώδη",
    lupin: "Λούπινο",
    celery: "Σέλινο",
    molluscs: "Μαλάκια",
  },
  ar: {
    wheat: "القمح/الغلوتين",
    dairy: "منتجات الألبان",
    eggs: "البيض",
    peanuts: "الفول السوداني",
    treeNuts: "المكسرات",
    soy: "الصويا",
    fish: "الأسماك",
    shellfish: "القشريات",
    sesame: "السمسم",
    mustard: "الخردل",
    sulfites: "الكبريتات",
    lupin: "الترمس",
    celery: "الكرفس",
    molluscs: "الرخويات",
  },
  hi: {
    wheat: "गेहूं/ग्लूटेन",
    dairy: "डेयरी",
    eggs: "अंडे",
    peanuts: "मूंगफली",
    treeNuts: "ट्री नट्स",
    soy: "सोया",
    fish: "मछली",
    shellfish: "शेलफिश",
    sesame: "तिल",
    mustard: "सरसों",
    sulfites: "सल्फाइट्स",
    lupin: "ल्यूपिन",
    celery: "अजवाइन",
    molluscs: "मोलस्क",
  },
};

// Template message for each language. {allergens} is replaced with the list.
const templates: Record<LanguageKey, string> = {
  en: "I have a severe food allergy to: {allergens}. Even trace amounts can make me very sick. Please ensure my meal contains NONE of these ingredients and is prepared with clean utensils and surfaces to avoid cross-contamination. Thank you for keeping me safe.",
  es: "Tengo una alergia alimentaria grave a: {allergens}. Incluso cantidades mínimas pueden causarme una reacción grave. Por favor, asegúrese de que mi comida NO contenga ninguno de estos ingredientes y que se prepare con utensilios y superficies limpios para evitar la contaminación cruzada. Gracias por mantenerme a salvo.",
  fr: "Je souffre d'une allergie alimentaire sévère à : {allergens}. Même des traces infimes peuvent me rendre très malade. Veuillez vous assurer que mon repas ne contient AUCUN de ces ingrédients et qu'il est préparé avec des ustensiles et des surfaces propres pour éviter toute contamination croisée. Merci de veiller à ma sécurité.",
  it: "Ho una grave allergia alimentare a: {allergens}. Anche tracce minime possono farmi stare molto male. Per favore, assicuratevi che il mio pasto NON contenga nessuno di questi ingredienti e che sia preparato con utensili e superfici puliti per evitare la contaminazione incrociata. Grazie per tenermi al sicuro.",
  de: "Ich habe eine schwere Lebensmittelallergie gegen: {allergens}. Selbst kleinste Spuren können mich sehr krank machen. Bitte stellen Sie sicher, dass meine Mahlzeit KEINE dieser Zutaten enthält und mit sauberen Utensilien und Oberflächen zubereitet wird, um Kreuzkontaminationen zu vermeiden. Vielen Dank, dass Sie mich schützen.",
  pt: "Tenho uma alergia alimentar grave a: {allergens}. Mesmo quantidades mínimas podem deixar-me muito doente. Por favor, certifique-se de que a minha refeição NÃO contém nenhum destes ingredientes e é preparada com utensílios e superfícies limpos para evitar contaminação cruzada. Obrigado por me manter seguro.",
  ja: "私は以下の食品に重度のアレルギーがあります：{allergens}。ごく微量でも重篤な症状を引き起こす可能性があります。私の食事にこれらの食材が一切含まれておらず、清潔な調理器具と調理台で交差汚染を避けて調理されていることをご確認ください。安全へのご配慮に感謝いたします。",
  zh: "我对以下食物有严重过敏：{allergens}。即使是微量也可能导致我严重不适。请确保我的餐食中不含任何这些成分，并使用清洁的器具和表面进行制备，以避免交叉污染。感谢您保护我的安全。",
  ko: "저는 다음 식품에 심각한 알레르기가 있습니다: {allergens}. 극미량이라도 심각한 반응을 일으킬 수 있습니다. 제 식사에 이러한 성분이 전혀 포함되어 있지 않고, 깨끗한 조리기구와 표면에서 교차 오염을 방지하여 조리되었는지 확인해 주십시오. 안전을 지켜주셔서 감사합니다.",
  th: "ฉันมีอาการแพ้อาหารอย่างรุนแรงต่อ: {allergens}. แม้ปริมาณเพียงเล็กน้อยก็สามารถทำให้ฉันป่วยหนักได้ กรุณาตรวจสอบให้แน่ใจว่าอาหารของฉันไม่มีส่วนผสมเหล่านี้เลย และเตรียมด้วยอุปกรณ์และพื้นผิวที่สะอาดเพื่อหลีกเลี่ยงการปนเปื้อนข้าม ขอบคุณที่ดูแลความปลอดภัยให้ฉัน",
  el: "Έχω σοβαρή τροφική αλλεργία σε: {allergens}. Ακόμη και ελάχιστες ποσότητες μπορούν να με αρρωστήσουν σοβαρά. Παρακαλώ βεβαιωθείτε ότι το γεύμα μου ΔΕΝ περιέχει κανένα από αυτά τα συστατικά και ότι παρασκευάζεται με καθαρά σκεύη και επιφάνειες για αποφυγή διασταυρούμενης μόλυνσης. Σας ευχαριστώ που με κρατάτε ασφαλή.",
  ar: "لدي حساسية غذائية شديدة تجاه: {allergens}. حتى الكميات الضئيلة يمكن أن تجعلني مريضًا جدًا. يرجى التأكد من أن وجبتي لا تحتوي على أي من هذه المكونات وأنها محضرة بأدوات وأسطح نظيفة لتجنب التلوث المتبادل. شكرًا لك على الحفاظ على سلامتي.",
  hi: "मुझे इनसे गंभीर खाद्य एलर्जी है: {allergens}. बहुत सूक्ष्म मात्रा भी मुझे बहुत बीमार कर सकती है। कृपया सुनिश्चित करें कि मेरे भोजन में इनमें से कोई भी सामग्री न हो और इसे साफ बर्तनों और सतहों पर तैयार किया जाए ताकि क्रॉस-संदूषण से बचा जा सके। मुझे सुरक्षित रखने के लिए धन्यवाद।",
};

// Header translation: "Food Allergy Alert"
const alertHeaders: Record<LanguageKey, string> = {
  en: "Food Allergy Alert",
  es: "Alerta de Alergia Alimentaria",
  fr: "Alerte Allergie Alimentaire",
  it: "Allarme Allergia Alimentare",
  de: "Lebensmittelallergie-Warnung",
  pt: "Alerta de Alergia Alimentar",
  ja: "食物アレルギー警告",
  zh: "食物过敏警报",
  ko: "식품 알레르기 경고",
  th: "คำเตือนการแพ้อาหาร",
  el: "Προειδοποίηση Τροφικής Αλλεργίας",
  ar: "تحذير من حساسية الطعام",
  hi: "खाद्य एलर्जी चेतावनी",
};

// Footer text
const footerTexts: Record<LanguageKey, string> = {
  es: "Generado por SafePlate",
  fr: "Généré par SafePlate",
  it: "Generato da SafePlate",
  de: "Erstellt von SafePlate",
  pt: "Gerado por SafePlate",
  ja: "SafePlateにより生成",
  zh: "由 SafePlate 生成",
  ko: "SafePlate에서 생성",
  th: "สร้างโดย SafePlate",
  el: "Δημιουργήθηκε από το SafePlate",
  ar: "تم إنشاؤه بواسطة SafePlate",
  hi: "SafePlate द्वारा निर्मित",
};

export function getAllergenName(
  lang: LanguageKey,
  allergen: AllergenKey,
): string {
  return allergenNames[lang][allergen];
}

export function getTemplateMessage(
  lang: LanguageKey,
  allergens: string,
): string {
  return templates[lang].replace("{allergens}", allergens);
}

export function getAlertHeader(lang: LanguageKey): string {
  return alertHeaders[lang];
}

export function getFooterText(lang: LanguageKey): string {
  return footerTexts[lang];
}
