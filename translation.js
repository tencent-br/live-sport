// Keep track of the current language globally
window.currentLang = 'en'; 

// Translation helper function
window.t = function(key, replacements = {}) {
    const dict = translations[window.currentLang] || translations['en'];
    let text = dict[key] || key; // Fallback to the key itself if translation is missing

    // Handle dynamic variable replacements (e.g., {{num}})
    for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`{{${placeholder}}}`, 'g'), value);
    }
    
    return text;
};

// Translation Dictionary
const translations = {

  // English (en)
  en: {
    live_sports: "Live Sports",
    upcoming: "Upcoming",
    finished: "Finished",
    extra_time: "Extra Time",
    penalties: "Penalties",
    live: "Live",
    postponed: "Postponed",
    cancelled: "Cancelled",
    suspended: "Suspended",
    syncing: "Syncing",
    finished_aet: "Finished (AET)",
    finished_aot: "Finished (AOT)",
    halftime: "Halftime",
    delayed: "Delayed",
    interrupted: "Interrupted",
    abandoned: "Abandoned",
    awarded: "Awarded",
    walkover: "Walkover",
    retired: "Retired",
    defaulted: "Defaulted",
    overtime: "Overtime",
    shootout: "Shootout",
    football: "Football",
    basketball: "Basketball",
    baseball: "Baseball",
    hockey: "Hockey",
    american_football: "Am. Football",
    more: "More",
    more_sports: "More Sports",
    adblock_notice: "For the best viewing experience, using an <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>ad-blocker</a> is recommended.",
    search_placeholder: "Search team, league, tournament or competition",
    highlights: "Highlights",
    pin_to_top: "Pin to top",
    unpin: "Unpin",

    match_count: {
      one: "{count} {sport} Match",
      other: "{count} {sport} Matches"
    },

    event_count: {
      one: "{count} {sport} Event",
      other: "{count} {sport} Events"
    }
},

// Chinese (zh)
zh: {
    live_sports: "体育直播",
    upcoming: "即将开始",
    finished: "已结束",
    extra_time: "加时赛",
    penalties: "点球",
    live: "直播中",
    postponed: "延期",
    cancelled: "已取消",
    suspended: "已暂停",
    syncing: "同步中",
    finished_aet: "已结束（加时赛）",
    finished_aot: "已结束（加时赛）",
    halftime: "半场",
    delayed: "延迟",
    interrupted: "比赛中断",
    abandoned: "比赛取消",
    awarded: "判胜",
    walkover: "不战而胜",
    retired: "退赛",
    defaulted: "被判负",
    overtime: "加时赛",
    shootout: "点球大战",
    football: "足球",
    basketball: "篮球",
    baseball: "棒球",
    hockey: "冰球",
    american_football: "美式足球",
    more: "更多",
    more_sports: "其他体育",
    adblock_notice: "为了获得最佳观看体验，建议使用<a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>广告拦截器</a>。",
    search_placeholder: "搜索球队、联赛、锦标赛或赛事",
    highlights: "精彩集锦",
    pin_to_top: "置顶",
    unpin: "取消置顶",
    match_count: {
      other: "{count} 场{sport}比赛 - 点击观看"
    },

    event_count: {
      other: "{count} 个{sport}赛事 - 点击观看"
    }
},

// Arabic (ar)
ar: {
    live_sports: "الرياضات المباشرة",
    upcoming: "القادمة",
    finished: "انتهت",
    extra_time: "الوقت الإضافي",
    penalties: "ركلات الترجيح",
    live: "مباشر",
    postponed: "مؤجلة",
    cancelled: "ملغاة",
    suspended: "معلقة",
    syncing: "جارٍ المزامنة",
    finished_aet: "انتهت (بعد الوقت الإضافي)",
    finished_aot: "انتهت (بعد الوقت الإضافي)",
    halftime: "استراحة",
    delayed: "متأخرة",
    interrupted: "متوقفة",
    abandoned: "ملغاة",
    awarded: "مُنحت",
    walkover: "فوز بالانسحاب",
    retired: "اعتزل",
    defaulted: "خسر بالتخلف",
    overtime: "وقت إضافي",
    shootout: "ركلات الترجيح",
    football: "كرة القدم",
    basketball: "كرة السلة",
    baseball: "البيسبول",
    hockey: "الهوكي",
    american_football: "كرة القدم الأمريكية",
    more: "المزيد",
    more_sports: "الرياضات الأخرى",
    adblock_notice: "للحصول على أفضل تجربة مشاهدة، يُنصح باستخدام <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>مانع الإعلانات</a>.",
    search_placeholder: "ابحث عن فريق أو دوري أو بطولة أو مسابقة",
    highlights: "أبرز اللقطات",
    pin_to_top: "تثبيت في الأعلى",
    unpin: "إلغاء التثبيت",

    match_count: {
      zero: "لا توجد مباريات {sport} - انقر للمشاهدة",
      one: "مباراة {sport} واحدة - انقر للمشاهدة",
      two: "مباراتان {sport} - انقر للمشاهدة",
      few: "{count} مباريات {sport} - انقر للمشاهدة",
      many: "{count} مباراة {sport} - انقر للمشاهدة",
      other: "{count} مباراة {sport} - انقر للمشاهدة"
    },

    event_count: {
      zero: "لا توجد أحداث {sport} - انقر للمشاهدة",
      one: "حدث {sport} واحد - انقر للمشاهدة",
      two: "حدثان {sport} - انقر للمشاهدة",
      few: "{count} أحداث {sport} - انقر للمشاهدة",
      many: "{count} حدثًا {sport} - انقر للمشاهدة",
      other: "{count} حدث {sport} - انقر للمشاهدة"
    }
},

// Hindi (hi)
hi: {
    live_sports: "लाइव स्पोर्ट्स",
    upcoming: "आगामी",
    finished: "समाप्त",
    extra_time: "अतिरिक्त समय",
    penalties: "पेनल्टी",
    live: "लाइव",
    postponed: "स्थगित",
    cancelled: "रद्द",
    suspended: "निलंबित",
    syncing: "सिंक हो रहा है",
    finished_aet: "समाप्त (अतिरिक्त समय)",
    finished_aot: "समाप्त (अतिरिक्त समय)",
    halftime: "हाफ़टाइम",
    delayed: "विलंबित",
    interrupted: "बाधित",
    abandoned: "रद्द",
    awarded: "विजेता घोषित",
    walkover: "वॉकओवर",
    retired: "रिटायर्ड",
    defaulted: "डिफ़ॉल्ट से हार",
    overtime: "अतिरिक्त समय",
    shootout: "पेनल्टी शूटआउट",
    football: "फुटबॉल",
    basketball: "बास्केटबॉल",
    baseball: "बेसबॉल",
    hockey: "हॉकी",
    american_football: "अमेरिकन फुटबॉल",
    more: "और अधिक",
    more_sports: "अन्य खेल",
    adblock_notice: "बेहतरीन देखने के अनुभव के लिए <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>ऐड-ब्लॉकर</a> का उपयोग करने की सलाह दी जाती है।",
    search_placeholder: "टीम, लीग, टूर्नामेंट या प्रतियोगिता खोजें",
    highlights: "हाइलाइट्स",
    pin_to_top: "शीर्ष पर पिन करें",
    unpin: "पिन हटाएँ",

    match_count: {
      one: "{count} {sport} मैच - देखने के लिए क्लिक करें",
      other: "{count} {sport} मैच - देखने के लिए क्लिक करें"
    },

    event_count: {
      one: "{count} {sport} इवेंट - देखने के लिए क्लिक करें",
      other: "{count} {sport} इवेंट - देखने के लिए क्लिक करें"
    }
},

// Bengali (bn)
bn: {
    live_sports: "লাইভ স্পোর্টস",
    upcoming: "আসন্ন",
    finished: "সমাপ্ত",
    extra_time: "অতিরিক্ত সময়",
    penalties: "পেনাল্টি",
    live: "লাইভ",
    postponed: "স্থগিত",
    cancelled: "বাতিল",
    suspended: "স্থগিত করা হয়েছে",
    syncing: "সিঙ্ক হচ্ছে",
    finished_aet: "শেষ (অতিরিক্ত সময়)",
    finished_aot: "শেষ (অতিরিক্ত সময়)",
    halftime: "হাফটাইম",
    delayed: "বিলম্বিত",
    interrupted: "বিঘ্নিত",
    abandoned: "পরিত্যক্ত",
    awarded: "বিজয়ী ঘোষণা",
    walkover: "ওয়াকওভার",
    retired: "অবসর নিয়েছেন",
    defaulted: "ডিফল্টে পরাজিত",
    overtime: "অতিরিক্ত সময়",
    shootout: "পেনাল্টি শুটআউট",
    football: "ফুটবল",
    basketball: "বাস্কেটবল",
    baseball: "বেসবল",
    hockey: "হকি",
    american_football: "আমেরিকান ফুটবল",
    more: "আরও",
    more_sports: "অন্যান্য স্পোর্টস",
    adblock_notice: "সেরা দেখার অভিজ্ঞতার জন্য একটি <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>অ্যাড-ব্লকার</a> ব্যবহার করার পরামর্শ দেওয়া হচ্ছে।",
    search_placeholder: "দল, লিগ, টুর্নামেন্ট বা প্রতিযোগিতা খুঁজুন",
    highlights: "হাইলাইটস",
    pin_to_top: "উপরে পিন করুন",
    unpin: "আনপিন করুন",

    match_count: {
      one: "{count}টি {sport} ম্যাচ - দেখতে ক্লিক করুন",
      other: "{count}টি {sport} ম্যাচ - দেখতে ক্লিক করুন"
    },

    event_count: {
      one: "{count}টি {sport} ইভেন্ট - দেখতে ক্লিক করুন",
      other: "{count}টি {sport} ইভেন্ট - দেখতে ক্লিক করুন"
    }
},

// Indonesian (id)
id: {
    live_sports: "Olahraga Langsung",
    upcoming: "Akan Datang",
    finished: "Selesai",
    extra_time: "Perpanjangan Waktu",
    penalties: "Adu Penalti",
    live: "Langsung",
    postponed: "Ditunda",
    cancelled: "Dibatalkan",
    suspended: "Ditangguhkan",
    syncing: "Menyinkronkan",
    finished_aet: "Selesai (AET)",
    finished_aot: "Selesai (AOT)",
    halftime: "Paruh Waktu",
    delayed: "Ditunda",
    interrupted: "Terhenti",
    abandoned: "Dibatalkan",
    awarded: "Dinyatakan Menang",
    walkover: "Menang WO",
    retired: "Mengundurkan Diri",
    defaulted: "Kalah karena WO",
    overtime: "Perpanjangan Waktu",
    shootout: "Adu Penalti",
    football: "Sepak Bola",
    basketball: "Bola Basket",
    baseball: "Bisbol",
    hockey: "Hoki",
    american_football: "Sepak Bola Amerika",
    more: "Lainnya",
    more_sports: "olahraga lainnya",
    adblock_notice: "Untuk pengalaman menonton terbaik, disarankan menggunakan <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>pemblokir iklan</a>.",
    search_placeholder: "Cari tim, liga, turnamen, atau kompetisi",
    highlights: "Sorotan",
    pin_to_top: "Sematkan di atas",
    unpin: "Lepas sematan",

    match_count: {
      one: "{count} Pertandingan {sport} - Klik untuk Menonton",
      other: "{count} Pertandingan {sport} - Klik untuk Menonton"
    },

    event_count: {
      one: "{count} Acara {sport} - Klik untuk Menonton",
      other: "{count} Acara {sport} - Klik untuk Menonton"
    }
},

// Italian (it)
it: {
    live_sports: "Sport in Diretta",
    upcoming: "In Arrivo",
    finished: "Terminato",
    extra_time: "Tempi Supplementari",
    penalties: "Rigori",
    live: "In Diretta",
    postponed: "Rinviato",
    cancelled: "Annullato",
    suspended: "Sospeso",
    syncing: "Sincronizzazione",
    finished_aet: "Terminata (AET)",
    finished_aot: "Terminata (AOT)",
    halftime: "Intervallo",
    delayed: "Rinviata",
    interrupted: "Interrotta",
    abandoned: "Abbandonata",
    awarded: "Assegnata",
    walkover: "Vittoria a tavolino",
    retired: "Ritirato",
    defaulted: "Sconfitto per rinuncia",
    overtime: "Supplementari",
    shootout: "Tiri di rigore",
    football: "Calcio",
    basketball: "Pallacanestro",
    baseball: "Baseball",
    hockey: "Hockey",
    american_football: "Football Americano",
    more: "Altro",
    more_sports: "altri sport",
    adblock_notice: "Per una migliore esperienza di visione, si consiglia di utilizzare un <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>blocco pubblicità</a>.",
    search_placeholder: "Cerca squadra, campionato, torneo o competizione",
    highlights: "Highlights",
    pin_to_top: "Fissa in alto",
    unpin: "Rimuovi pin",

    match_count: {
      one: "{count} partita di {sport} - Clicca per guardare",
      other: "{count} partite di {sport} - Clicca per guardare"
    },

    event_count: {
      one: "{count} evento di {sport} - Clicca per guardare",
      other: "{count} eventi di {sport} - Clicca per guardare"
    }
},

// Japanese (ja)
ja: {
    live_sports: "ライブスポーツ",
    upcoming: "今後の試合",
    finished: "終了",
    extra_time: "延長戦",
    penalties: "PK戦",
    live: "ライブ",
    postponed: "延期",
    cancelled: "中止",
    suspended: "一時停止",
    syncing: "同期中",
    finished_aet: "終了（延長戦）",
    finished_aot: "終了（延長戦）",
    halftime: "ハーフタイム",
    delayed: "遅延",
    interrupted: "中断",
    abandoned: "中止",
    awarded: "勝利認定",
    walkover: "不戦勝",
    retired: "棄権",
    defaulted: "失格",
    overtime: "延長戦",
    shootout: "PK戦",
    football: "サッカー",
    basketball: "バスケットボール",
    baseball: "野球",
    hockey: "ホッケー",
    american_football: "アメリカンフットボール",
    more: "もっと見る",
    more_sports: "その他のスポーツ",
    adblock_notice: "快適に視聴するには、<a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>広告ブロッカー</a>の使用をおすすめします。",
    search_placeholder: "チーム、リーグ、トーナメント、または大会を検索",
    highlights: "ハイライト",
    pin_to_top: "上部に固定",
    unpin: "固定を解除",

    match_count: {
      other: "{count}件の{sport}の試合 - クリックして視聴"
    },

    event_count: {
      other: "{count}件の{sport}イベント - クリックして視聴"
    }
},

// Korean (ko)
ko: {
    live_sports: "실시간 스포츠",
    upcoming: "예정",
    finished: "종료",
    extra_time: "연장전",
    penalties: "승부차기",
    live: "실시간",
    postponed: "연기됨",
    cancelled: "취소됨",
    suspended: "중단됨",
    syncing: "동기화 중",
    finished_aet: "종료 (연장전)",
    finished_aot: "종료 (연장전)",
    halftime: "하프타임",
    delayed: "지연",
    interrupted: "중단",
    abandoned: "취소",
    awarded: "승리 처리",
    walkover: "부전승",
    retired: "기권",
    defaulted: "몰수패",
    overtime: "연장전",
    shootout: "승부차기",
    football: "축구",
    basketball: "농구",
    baseball: "야구",
    hockey: "하키",
    american_football: "미식축구",
    more: "더보기",
    more_sports: "기타 스포츠",
    adblock_notice: "최상의 시청 환경을 위해 <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>광고 차단기</a> 사용을 권장합니다.",
    search_placeholder: "팀, 리그, 토너먼트 또는 대회 검색",
    highlights: "하이라이트",
    pin_to_top: "맨 위에 고정",
    unpin: "고정 해제",

    match_count: {
      other: "{count}개의 {sport} 경기 - 클릭하여 시청"
    },

    event_count: {
      other: "{count}개의 {sport} 이벤트 - 클릭하여 시청"
    }
},

// Russian (ru)
ru: {
    live_sports: "Спорт в прямом эфире",
    upcoming: "Предстоящие",
    finished: "Завершённые",
    extra_time: "Дополнительное время",
    penalties: "Пенальти",
    live: "Прямой эфир",
    postponed: "Отложено",
    cancelled: "Отменено",
    suspended: "Приостановлено",
    syncing: "Синхронизация",
    finished_aet: "Завершено (доп. время)",
    finished_aot: "Завершено (доп. время)",
    halftime: "Перерыв",
    delayed: "Задержка",
    interrupted: "Прервано",
    abandoned: "Отменено",
    awarded: "Присуждена победа",
    walkover: "Победа без игры",
    retired: "Снялся",
    defaulted: "Поражение за неявку",
    overtime: "Овертайм",
    shootout: "Серия пенальти",
    football: "Футбол",
    basketball: "Баскетбол",
    baseball: "Бейсбол",
    hockey: "Хоккей",
    american_football: "Американский футбол",
    more: "Ещё",
    more_sports: "другим видам спорта",
    adblock_notice: "Для лучшего просмотра рекомендуется использовать <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>блокировщик рекламы</a>.",
    search_placeholder: "Поиск команды, лиги, турнира или соревнования",
    highlights: "Лучшие моменты",
    pin_to_top: "Закрепить вверху",
    unpin: "Открепить",

    match_count: {
      one: "{count} матч по виду спорта «{sport}» — Нажмите, чтобы смотреть",
      few: "{count} матча по виду спорта «{sport}» — Нажмите, чтобы смотреть",
      many: "{count} матчей по виду спорта «{sport}» — Нажмите, чтобы смотреть",
      other: "{count} матча по виду спорта «{sport}» — Нажмите, чтобы смотреть"
    },

    event_count: {
      one: "{count} событие «{sport}» — Нажмите, чтобы смотреть",
      few: "{count} события «{sport}» — Нажмите, чтобы смотреть",
      many: "{count} событий «{sport}» — Нажмите, чтобы смотреть",
      other: "{count} события «{sport}» — Нажмите, чтобы смотреть"
    }
},

// French (fr)
fr: {
    live_sports: "Sports en direct",
    upcoming: "À venir",
    finished: "Terminé",
    extra_time: "Prolongation",
    penalties: "Tirs au but",
    live: "En direct",
    postponed: "Reporté",
    cancelled: "Annulé",
    suspended: "Suspendu",
    syncing: "Synchronisation",
    finished_aet: "Terminé (AET)",
    finished_aot: "Terminé (AOT)",
    halftime: "Mi-temps",
    delayed: "Retardé",
    interrupted: "Interrompu",
    abandoned: "Abandonné",
    awarded: "Victoire attribuée",
    walkover: "Victoire par forfait",
    retired: "Abandon",
    defaulted: "Défaite par forfait",
    overtime: "Prolongation",
    shootout: "Tirs au but",
    football: "Football",
    basketball: "Basket-ball",
    baseball: "Baseball",
    hockey: "Hockey",
    american_football: "Football américain",
    more: "Plus",
    more_sports: "autres sports",
    adblock_notice: "Pour une meilleure expérience de visionnage, il est recommandé d'utiliser un <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>bloqueur de publicités</a>.",
    search_placeholder: "Rechercher une équipe, une ligue, un tournoi ou une compétition",
    highlights: "Temps forts",
    pin_to_top: "Épingler en haut",
    unpin: "Désépingler",

    match_count: {
      one: "{count} match de {sport} - Cliquez pour regarder",
      other: "{count} matchs de {sport} - Cliquez pour regarder"
    },

    event_count: {
      one: "{count} événement de {sport} - Cliquez pour regarder",
      other: "{count} événements de {sport} - Cliquez pour regarder"
    }

},

// Spanish (es)
es: {
    live_sports: "Deportes en vivo",
    upcoming: "Próximos",
    finished: "Finalizados",
    extra_time: "Tiempo extra",
    penalties: "Penaltis",
    live: "En vivo",
    postponed: "Aplazado",
    cancelled: "Cancelado",
    suspended: "Suspendido",
    syncing: "Sincronizando",
    finished_aet: "Finalizado (AET)",
    finished_aot: "Finalizado (AOT)",
    halftime: "Descanso",
    delayed: "Retrasado",
    interrupted: "Interrumpido",
    abandoned: "Abandonado",
    awarded: "Victoria otorgada",
    walkover: "Victoria por incomparecencia",
    retired: "Retirado",
    defaulted: "Derrota por incomparecencia",
    overtime: "Prórroga",
    shootout: "Tanda de penaltis",
    football: "Fútbol",
    basketball: "Baloncesto",
    baseball: "Béisbol",
    hockey: "Hockey",
    american_football: "Fútbol americano",
    more: "Más",
    more_sports: "otros deportes",
    adblock_notice: "Para disfrutar de la mejor experiencia de visualización, se recomienda utilizar un <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>bloqueador de anuncios</a>.",
    search_placeholder: "Buscar equipo, liga, torneo o competición",
    highlights: "Momentos destacados",
    pin_to_top: "Fijar arriba",
    unpin: "Desfijar",

    match_count: {
      one: "{count} partido de {sport} - Haz clic para ver",
      other: "{count} partidos de {sport} - Haz clic para ver"
    },

    event_count: {
      one: "{count} evento de {sport} - Haz clic para ver",
      other: "{count} eventos de {sport} - Haz clic para ver"
    }
},

// Brazilian Portuguese (pt)
pt: {
    live_sports: "Esportes ao Vivo",
    upcoming: "Próximos",
    finished: "Finalizados",
    extra_time: "Prorrogação",
    penalties: "Pênaltis",
    live: "Ao Vivo",
    postponed: "Adiado",
    cancelled: "Cancelado",
    suspended: "Suspenso",
    syncing: "Sincronizando",
    finished_aet: "Encerrado (AET)",
    finished_aot: "Encerrado (AOT)",
    halftime: "Intervalo",
    delayed: "Atrasado",
    interrupted: "Interrompido",
    abandoned: "Abandonado",
    awarded: "Vitória atribuída",
    walkover: "Vitória por W.O.",
    retired: "Retirado",
    defaulted: "Derrota por W.O.",
    overtime: "Prorrogação",
    shootout: "Disputa de pênaltis",
    football: "Futebol",
    basketball: "Basquete",
    baseball: "Beisebol",
    hockey: "Hóquei",
    american_football: "Futebol Americano",
    more: "Mais",
    more_sports: "outros esportes",
    adblock_notice: "Para ter a melhor experiência de visualização, recomendamos usar um <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>bloqueador de anúncios</a>.",
    search_placeholder: "Pesquisar time, liga, torneio ou competição",
    highlights: "Melhores Momentos",
    pin_to_top: "Fixar no topo",
    unpin: "Desafixar",

    match_count: {
      one: "{count} partida de {sport} - Clique para assistir",
      other: "{count} partidas de {sport} - Clique para assistir"
    },

    event_count: {
      one: "{count} evento de {sport} - Clique para assistir",
      other: "{count} eventos de {sport} - Clique para assistir"
    }
},

// German (de)
de: {
    live_sports: "Live-Sport",
    upcoming: "Bevorstehend",
    finished: "Beendet",
    extra_time: "Verlängerung",
    penalties: "Elfmeterschießen",
    live: "Live",
    postponed: "Verschoben",
    cancelled: "Abgesagt",
    suspended: "Unterbrochen",
    syncing: "Synchronisierung",
    finished_aet: "Beendet (AET)",
    finished_aot: "Beendet (AOT)",
    halftime: "Halbzeit",
    delayed: "Verzögert",
    interrupted: "Unterbrochen",
    abandoned: "Abgebrochen",
    awarded: "Sieg zugesprochen",
    walkover: "Sieg ohne Spiel",
    retired: "Aufgegeben",
    defaulted: "Niederlage durch Nichtantritt",
    overtime: "Verlängerung",
    shootout: "Elfmeterschießen",
    football: "Fußball",
    basketball: "Basketball",
    baseball: "Baseball",
    hockey: "Eishockey",
    american_football: "American Football",
    more: "Mehr",
    more_sports: "weitere Sportarten",
    adblock_notice: "Für das beste Fernseherlebnis wird die Verwendung eines <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>Werbeblockers</a> empfohlen.",
    search_placeholder: "Team, Liga, Turnier oder Wettbewerb suchen",
    highlights: "Highlights",
    pin_to_top: "Oben anheften",
    unpin: "Anheftung lösen",

    match_count: {
      one: "{count} {sport}-Spiel - Zum Ansehen klicken",
      other: "{count} {sport}-Spiele - Zum Ansehen klicken"
    },

    event_count: {
      one: "{count} {sport}-Event - Zum Ansehen klicken",
      other: "{count} {sport}-Events - Zum Ansehen klicken"
    }
},

// Turkish (tr)
tr: {
    live_sports: "Canlı Spor",
    upcoming: "Yaklaşan",
    finished: "Tamamlandı",
    extra_time: "Uzatma",
    penalties: "Penaltılar",
    live: "Canlı",
    postponed: "Ertelendi",
    cancelled: "İptal Edildi",
    suspended: "Askıya Alındı",
    syncing: "Senkronize Ediliyor",
    finished_aet: "Bitti (AET)",
    finished_aot: "Bitti (AOT)",
    halftime: "Devre Arası",
    delayed: "Gecikmeli",
    interrupted: "Durduruldu",
    abandoned: "Terk Edildi",
    awarded: "Hükmen Kazandı",
    walkover: "Hükmen Galibiyet",
    retired: "Çekildi",
    defaulted: "Hükmen Mağlubiyet",
    overtime: "Uzatmalar",
    shootout: "Penaltı Atışları",
    football: "Futbol",
    basketball: "Basketbol",
    baseball: "Beyzbol",
    hockey: "Hokey",
    american_football: "Amerikan Futbolu",
    more: "Daha Fazla",
    more_sports: "diğer sporlar",
    adblock_notice: "En iyi izleme deneyimi için bir <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>reklam engelleyici</a> kullanmanız önerilir.",
    search_placeholder: "Takım, lig, turnuva veya müsabaka ara",
    highlights: "Öne Çıkanlar",
    pin_to_top: "En üste sabitle",
    unpin: "Sabitlemeyi kaldır",

    match_count: {
      one: "{count} {sport} Maçı - İzlemek için tıklayın",
      other: "{count} {sport} Maçı - İzlemek için tıklayın"
    },

    event_count: {
      one: "{count} {sport} Etkinliği - İzlemek için tıklayın",
      other: "{count} {sport} Etkinliği - İzlemek için tıklayın"
    }
},

// Vietnamese (vi)
vi: {
    live_sports: "Thể thao trực tiếp",
    upcoming: "Sắp diễn ra",
    finished: "Đã kết thúc",
    extra_time: "Hiệp phụ",
    penalties: "Loạt sút luân lưu",
    live: "Trực tiếp",
    postponed: "Hoãn",
    cancelled: "Đã hủy",
    suspended: "Tạm dừng",
    syncing: "Đang đồng bộ",
    finished_aet: "Kết thúc (AET)",
    finished_aot: "Kết thúc (AOT)",
    halftime: "Nghỉ giữa hiệp",
    delayed: "Trì hoãn",
    interrupted: "Gián đoạn",
    abandoned: "Hủy bỏ",
    awarded: "Được xử thắng",
    walkover: "Thắng do đối thủ bỏ cuộc",
    retired: "Bỏ cuộc",
    defaulted: "Thua do bị xử",
    overtime: "Hiệp phụ",
    shootout: "Loạt sút luân lưu",
    football: "Bóng đá",
    basketball: "Bóng rổ",
    baseball: "Bóng chày",
    hockey: "Khúc côn cầu",
    american_football: "Bóng bầu dục Mỹ",
    more: "Xem thêm",
    more_sports: "các môn thể thao khác",
    adblock_notice: "Để có trải nghiệm xem tốt nhất, bạn nên sử dụng <a href='https://adguard.com/en/adguard-browser-extension/overview.html' target='_blank'>trình chặn quảng cáo</a>.",
    search_placeholder: "Tìm kiếm đội, giải đấu, giải vô địch hoặc cuộc thi",
    highlights: "Điểm nổi bật",
    pin_to_top: "Ghim lên đầu",
    unpin: "Bỏ ghim",

    match_count: {
      one: "{count} trận {sport} - Nhấp để xem",
      other: "{count} trận {sport} - Nhấp để xem"
    },

    event_count: {
      one: "{count} sự kiện {sport} - Nhấp để xem",
      other: "{count} sự kiện {sport} - Nhấp để xem"
    }
}
};


function translatePage(lang) {
  const elements = document.querySelectorAll("[data-i18n]");
  const dict = translations[lang];

  if (!dict) return;

  elements.forEach(el => {
    const key = el.getAttribute("data-i18n");

    if (!dict[key]) return;

    const translatedText = dict[key];

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.setAttribute("placeholder", translatedText);
    } 
    else if (el.hasAttribute("data-i18n-html")) {
      el.innerHTML = translatedText;
    } 
    else {
      el.textContent = translatedText;
    }
  });

  document.body.dir = (lang === "ar") ? "rtl" : "ltr";
}


// 2. Detection Logic
function detectLanguage() {
  // Priority 1: Did the user MANUALLY select a language in the past?
  const manualChoice = localStorage.getItem("userSelectedLang");
  if (manualChoice && translations[manualChoice]) return manualChoice;

  // Priority 2: Use Chrome/Browser language
  const uiLang = (typeof chrome !== "undefined" && chrome.i18n) 
    ? chrome.i18n.getUILanguage() 
    : navigator.language;

  const browserCode = uiLang.split('-')[0];
  return translations[browserCode] ? browserCode : "en";
}


// 3. Initialization
document.addEventListener("DOMContentLoaded", () => {
  window.currentLang = detectLanguage(); // Update global state
  translatePage(window.currentLang);

  const switcher = document.getElementById("langSwitcher");
  if (switcher) {
    switcher.value = window.currentLang;
    
    switcher.addEventListener("change", (event) => {
      const selected = event.target.value;
      window.currentLang = selected; // Update global state on change
      localStorage.setItem("userSelectedLang", selected);
      translatePage(selected);
      
      // OPTIONAL: Re-render dynamic lists in custom.js if needed to instantly translate dynamic content
      if (typeof renderList === "function") renderList(); 
    });
  }
});


function translateCount(key, count, sport) {
  const lang = window.currentLang || "en";
  const dict = translations[lang];

  if (!dict || !dict[key]) return "";

  const pluralCategory = new Intl.PluralRules(lang).select(count);

  const template =
    dict[key][pluralCategory] ||
    dict[key].other;

  if (!template) return "";

  return template
    .replace(/\{count\}/g, count)
    .replace(/\{sport\}/g, sport);
}
