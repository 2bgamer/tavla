/* ---------- ANA EKRAN SEKMELERİ: Seçenekler · Odalar · Skorlar ----------
   Seçenekler kutusunun başlığı üç sekmeye döner. Seçenekler: seçili modun ayarları. Odalar: rakip bekleyen odalar ve kodla katılma
   (index.html'deki #rmList ve kod satırı buraya taşınır). Skorlar: oyuncunun ülkesinde ve dünyada en iyi 20, en altta oyuncunun kendi sırası.
   Skor tablosu RTDB'de: lb/w/<uid> = {n, av, xp, c, t} (dünya) ve lb/c/<ÜLKE>/<uid> = {n, av, xp, t} (ülke). Herkes okur, yalnız girişli
   oyuncu kendi kaydını yazar (database.rules.json). Misafirin puanı listeye girmez; tahmini sırası gösterilir.
   Ülke saat diliminden bulunur (bulunamazsa tarayıcı dili, o da yoksa TR); oyuncu Skorlar sekmesinden değiştirebilir (tavla_cc). */
(function(){
  'use strict';
  // saat dilimi → ülke (IANA zone.tab + eski adlar), "ÜLKE:bölge/şehir,…|…"
  const TZ='AD:Europe/Andorra|AE:Asia/Dubai|AF:Asia/Kabul|AG:America/Antigua|AI:America/Anguilla|AL:Europe/Tirane|AM:Asia/Yerevan|AO:Africa/Luanda|AQ:Antarctica/Casey,Antarctica/Davis,Antarctica/DumontDUrville,Antarctica/Mawson,Antarctica/McMurdo,Antarctica/Palmer,Antarctica/Rothera,Antarctica/South_Pole,Antarctica/Syowa,Antarctica/Troll,Antarctica/Vostok|AR:America/Argentina/Buenos_Aires,America/Argentina/Catamarca,America/Argentina/ComodRivadavia,America/Argentina/Cordoba,America/Argentina/Jujuy,America/Argentina/La_Rioja,America/Argentina/Mendoza,America/Argentina/Rio_Gallegos,America/Argentina/Salta,America/Argentina/San_Juan,America/Argentina/San_Luis,America/Argentina/Tucuman,America/Argentina/Ushuaia,America/Buenos_Aires,America/Catamarca,America/Cordoba,America/Jujuy,America/Mendoza,America/Rosario|AS:Pacific/Pago_Pago,Pacific/Samoa,US/Samoa|AT:Europe/Vienna|AU:Antarctica/Macquarie,Australia/ACT,Australia/Adelaide,Australia/Brisbane,Australia/Broken_Hill,Australia/Canberra,Australia/Darwin,Australia/Eucla,Australia/Hobart,Australia/LHI,Australia/Lindeman,Australia/Lord_Howe,Australia/Melbourne,Australia/NSW,Australia/North,Australia/Perth,Australia/Queensland,Australia/South,Australia/Sydney,Australia/Tasmania,Australia/Victoria,Australia/West,Australia/Yancowinna|AW:America/Aruba|AX:Europe/Mariehamn|AZ:Asia/Baku|BA:Europe/Sarajevo|BB:America/Barbados|BD:Asia/Dacca,Asia/Dhaka|BE:Europe/Brussels|BF:Africa/Ouagadougou|BG:Europe/Sofia|BH:Asia/Bahrain|BI:Africa/Bujumbura|BJ:Africa/Porto-Novo|BL:America/St_Barthelemy|BM:Atlantic/Bermuda|BN:Asia/Brunei|BO:America/La_Paz|BQ:America/Kralendijk|BR:America/Araguaina,America/Bahia,America/Belem,America/Boa_Vista,America/Campo_Grande,America/Cuiaba,America/Eirunepe,America/Fortaleza,America/Maceio,America/Manaus,America/Noronha,America/Porto_Acre,America/Porto_Velho,America/Recife,America/Rio_Branco,America/Santarem,America/Sao_Paulo,Brazil/Acre,Brazil/DeNoronha,Brazil/East,Brazil/West|BS:America/Nassau|BT:Asia/Thimbu,Asia/Thimphu|BW:Africa/Gaborone|BY:Europe/Minsk|BZ:America/Belize|CA:America/Atikokan,America/Blanc-Sablon,America/Cambridge_Bay,America/Coral_Harbour,America/Creston,America/Dawson,America/Dawson_Creek,America/Edmonton,America/Fort_Nelson,America/Glace_Bay,America/Goose_Bay,America/Halifax,America/Inuvik,America/Iqaluit,America/Moncton,America/Montreal,America/Nipigon,America/Pangnirtung,America/Rainy_River,America/Rankin_Inlet,America/Regina,America/Resolute,America/St_Johns,America/Swift_Current,America/Thunder_Bay,America/Toronto,America/Vancouver,America/Whitehorse,America/Winnipeg,America/Yellowknife,Canada/Atlantic,Canada/Central,Canada/Eastern,Canada/Mountain,Canada/Newfoundland,Canada/Pacific,Canada/Saskatchewan,Canada/Yukon|CC:Indian/Cocos|CD:Africa/Kinshasa,Africa/Lubumbashi|CF:Africa/Bangui|CG:Africa/Brazzaville|CH:Europe/Zurich|CI:Africa/Abidjan,Africa/Timbuktu|CK:Pacific/Rarotonga|CL:America/Punta_Arenas,America/Santiago,Chile/Continental,Chile/EasterIsland,Pacific/Easter|CM:Africa/Douala|CN:Asia/Chongqing,Asia/Chungking,Asia/Harbin,Asia/Shanghai,Asia/Urumqi|CO:America/Bogota|CR:America/Costa_Rica|CU:America/Havana|CV:Atlantic/Cape_Verde|CW:America/Curacao|CX:Indian/Christmas|CY:Asia/Famagusta,Asia/Nicosia,Europe/Nicosia|CZ:Europe/Prague|DE:Europe/Berlin,Europe/Busingen|DJ:Africa/Djibouti|DK:Europe/Copenhagen|DM:America/Dominica|DO:America/Santo_Domingo|DZ:Africa/Algiers|EC:America/Guayaquil,Pacific/Galapagos|EE:Europe/Tallinn|EG:Africa/Cairo|EH:Africa/El_Aaiun|ER:Africa/Asmara,Africa/Asmera|ES:Africa/Ceuta,Atlantic/Canary,Europe/Madrid|ET:Africa/Addis_Ababa|FI:Europe/Helsinki|FJ:Pacific/Fiji|FK:Atlantic/Stanley|FM:Pacific/Chuuk,Pacific/Kosrae,Pacific/Pohnpei,Pacific/Ponape,Pacific/Truk,Pacific/Yap|FO:Atlantic/Faeroe,Atlantic/Faroe|FR:Europe/Paris|GA:Africa/Libreville|GB:Europe/Belfast,Europe/London|GD:America/Grenada|GE:Asia/Tbilisi|GF:America/Cayenne|GG:Europe/Guernsey|GH:Africa/Accra|GI:Europe/Gibraltar|GL:America/Danmarkshavn,America/Nuuk,America/Scoresbysund,America/Thule,America/Godthab|GM:Africa/Banjul|GN:Africa/Conakry|GP:America/Guadeloupe|GQ:Africa/Malabo|GR:Europe/Athens|GS:Atlantic/South_Georgia|GT:America/Guatemala|GU:Pacific/Guam|GW:Africa/Bissau|GY:America/Guyana|HK:Asia/Hong_Kong|HN:America/Tegucigalpa|HR:Europe/Zagreb|HT:America/Port-au-Prince|HU:Europe/Budapest|ID:Asia/Jakarta,Asia/Jayapura,Asia/Makassar,Asia/Pontianak,Asia/Ujung_Pandang|IE:Europe/Dublin|IL:Asia/Jerusalem,Asia/Tel_Aviv|IM:Europe/Isle_of_Man|IN:Asia/Calcutta,Asia/Kolkata|IO:Indian/Chagos|IQ:Asia/Baghdad|IR:Asia/Tehran|IS:Atlantic/Reykjavik|IT:Europe/Rome|JE:Europe/Jersey|JM:America/Jamaica|JO:Asia/Amman|JP:Asia/Tokyo|KE:Africa/Nairobi|KG:Asia/Bishkek|KH:Asia/Phnom_Penh|KI:Pacific/Enderbury,Pacific/Kanton,Pacific/Kiritimati,Pacific/Tarawa|KM:Indian/Comoro|KN:America/St_Kitts|KP:Asia/Pyongyang|KR:Asia/Seoul|KW:Asia/Kuwait|KY:America/Cayman|KZ:Asia/Almaty,Asia/Aqtau,Asia/Aqtobe,Asia/Atyrau,Asia/Oral,Asia/Qostanay,Asia/Qyzylorda|LA:Asia/Vientiane|LB:Asia/Beirut|LC:America/St_Lucia|LI:Europe/Vaduz|LK:Asia/Colombo|LR:Africa/Monrovia|LS:Africa/Maseru|LT:Europe/Vilnius|LU:Europe/Luxembourg|LV:Europe/Riga|LY:Africa/Tripoli|MA:Africa/Casablanca|MC:Europe/Monaco|MD:Europe/Chisinau,Europe/Tiraspol|ME:Europe/Podgorica|MF:America/Marigot|MG:Indian/Antananarivo|MH:Pacific/Kwajalein,Pacific/Majuro|MK:Europe/Skopje|ML:Africa/Bamako|MM:Asia/Rangoon,Asia/Yangon|MN:Asia/Choibalsan,Asia/Hovd,Asia/Ulaanbaatar,Asia/Ulan_Bator|MO:Asia/Macao,Asia/Macau|MP:Pacific/Saipan|MQ:America/Martinique|MR:Africa/Nouakchott|MS:America/Montserrat|MT:Europe/Malta|MU:Indian/Mauritius|MV:Indian/Maldives|MW:Africa/Blantyre|MX:America/Bahia_Banderas,America/Cancun,America/Chihuahua,America/Ciudad_Juarez,America/Ensenada,America/Hermosillo,America/Matamoros,America/Mazatlan,America/Merida,America/Mexico_City,America/Monterrey,America/Ojinaga,America/Santa_Isabel,America/Tijuana,Mexico/BajaNorte,Mexico/BajaSur,Mexico/General|MY:Asia/Kuala_Lumpur,Asia/Kuching|MZ:Africa/Maputo|NA:Africa/Windhoek|NC:Pacific/Noumea|NE:Africa/Niamey|NF:Pacific/Norfolk|NG:Africa/Lagos|NI:America/Managua|NL:Europe/Amsterdam|NO:Europe/Oslo|NP:Asia/Kathmandu,Asia/Katmandu|NR:Pacific/Nauru|NU:Pacific/Niue|NZ:Antarctica/McMurdo,NZ,Pacific/Auckland,Pacific/Chatham,NZ-CHAT|OM:Asia/Muscat|PA:America/Panama|PE:America/Lima|PF:Pacific/Gambier,Pacific/Marquesas,Pacific/Tahiti|PG:Pacific/Bougainville,Pacific/Port_Moresby|PH:Asia/Manila|PK:Asia/Karachi|PL:Europe/Warsaw|PM:America/Miquelon|PN:Pacific/Pitcairn|PR:America/Puerto_Rico|PS:Asia/Gaza,Asia/Hebron|PT:Atlantic/Azores,Atlantic/Madeira,Europe/Lisbon|PW:Pacific/Palau|PY:America/Asuncion|QA:Asia/Qatar|RE:Indian/Reunion|RO:Europe/Bucharest|RS:Europe/Belgrade|RU:Asia/Anadyr,Asia/Barnaul,Asia/Chita,Asia/Irkutsk,Asia/Kamchatka,Asia/Khandyga,Asia/Krasnoyarsk,Asia/Magadan,Asia/Novokuznetsk,Asia/Novosibirsk,Asia/Omsk,Asia/Sakhalin,Asia/Srednekolymsk,Asia/Tomsk,Asia/Ust-Nera,Asia/Vladivostok,Asia/Yakutsk,Asia/Yekaterinburg,Europe/Astrakhan,Europe/Kaliningrad,Europe/Kirov,Europe/Moscow,Europe/Samara,Europe/Saratov,Europe/Ulyanovsk,Europe/Volgograd,W-SU|RW:Africa/Kigali|SA:Asia/Riyadh|SB:Pacific/Guadalcanal|SC:Indian/Mahe|SD:Africa/Khartoum|SE:Europe/Stockholm|SG:Asia/Singapore,Singapore|SH:Atlantic/St_Helena|SI:Europe/Ljubljana|SJ:Arctic/Longyearbyen,Atlantic/Jan_Mayen|SK:Europe/Bratislava|SL:Africa/Freetown|SM:Europe/San_Marino|SN:Africa/Dakar|SO:Africa/Mogadishu|SR:America/Paramaribo|SS:Africa/Juba|ST:Africa/Sao_Tome|SV:America/El_Salvador|SX:America/Lower_Princes|SY:Asia/Damascus|SZ:Africa/Mbabane|TC:America/Grand_Turk|TD:Africa/Ndjamena|TF:Indian/Kerguelen|TG:Africa/Lome|TH:Asia/Bangkok|TJ:Asia/Dushanbe|TK:Pacific/Fakaofo|TL:Asia/Dili|TM:Asia/Ashgabat,Asia/Ashkhabad|TN:Africa/Tunis|TO:Pacific/Tongatapu|TR:Asia/Istanbul,Europe/Istanbul,Turkey|TT:America/Port_of_Spain|TV:Pacific/Funafuti|TW:Asia/Taipei,ROC|TZ:Africa/Dar_es_Salaam|UA:Europe/Kiev,Europe/Kyiv,Europe/Simferopol,Europe/Uzhgorod,Europe/Zaporozhye|UG:Africa/Kampala|UM:Pacific/Midway,Pacific/Wake|US:America/Adak,America/Anchorage,America/Atka,America/Boise,America/Chicago,America/Denver,America/Detroit,America/Fort_Wayne,America/Indiana/Indianapolis,America/Indiana/Knox,America/Indiana/Marengo,America/Indiana/Petersburg,America/Indiana/Tell_City,America/Indiana/Vevay,America/Indiana/Vincennes,America/Indiana/Winamac,America/Indianapolis,America/Juneau,America/Kentucky/Louisville,America/Kentucky/Monticello,America/Knox_IN,America/Los_Angeles,America/Louisville,America/Menominee,America/Metlakatla,America/New_York,America/Nome,America/North_Dakota/Beulah,America/North_Dakota/Center,America/North_Dakota/New_Salem,America/Phoenix,America/Shiprock,America/Sitka,America/Yakutat,Navajo,Pacific/Honolulu,Pacific/Johnston,US/Alaska,US/Aleutian,US/Arizona,US/Central,US/East-Indiana,US/Eastern,US/Hawaii,US/Indiana-Starke,US/Michigan,US/Mountain,US/Pacific|UY:America/Montevideo|UZ:Asia/Samarkand,Asia/Tashkent|VA:Europe/Vatican|VC:America/St_Vincent|VE:America/Caracas|VG:America/Tortola|VI:America/St_Thomas,America/Virgin|VN:Asia/Ho_Chi_Minh,Asia/Saigon|VU:Pacific/Efate|WF:Pacific/Wallis|WS:Pacific/Apia|YE:Asia/Aden|YT:Indian/Mayotte|ZA:Africa/Johannesburg|ZM:Africa/Lusaka|ZW:Africa/Harare';
  const TZM={},CCS=[];
  TZ.split('|').forEach(g=>{const [c,zs]=g.split(':');CCS.push(c);zs.split(',').forEach(z=>{if(!TZM[z])TZM[z]=c;});});
  const okCC=c=>typeof c==='string'&&CCS.includes(c);
  function detectCC(){
    let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
    if(TZM[tz])return TZM[tz];
    for(const l of (navigator.languages||[navigator.language||''])){const m=/[-_]([A-Za-z]{2})$/.exec(l||'');if(m&&okCC(m[1].toUpperCase()))return m[1].toUpperCase();}
    return 'TR';
  }
  const myCC=()=>{const c=lsGet('tavla_cc',null);return okCC(c)?c:detectCC();};
  const flag=c=>String.fromCodePoint(...[...c].map(x=>127397+x.charCodeAt(0)));
  let DN=null,DNL='';
  function ccName(c){
    if(DNL!==ULOC()){DNL=ULOC();try{DN=new Intl.DisplayNames([DNL],{type:'region'});}catch(e){DN=null;}}
    try{return (DN&&DN.of(c))||c;}catch(e){return c;}
  }

  const L={
    tr:{tabRm:'Odalar',tabSc:'Skorlar',rmWait:'Rakip bekleyen oyunlar',scWorld:'Dünya',scLoad:'Skorlar yükleniyor…',scErr:'Skorlar şu an yüklenemedi. Biraz sonra yeniden dene.',
      scNone:'Bu listede henüz kimse yok. İlk sen ol!',scYou:'Senin sıran',scPts:'{p} puan',scGuest:'Misafir puanı sıralamaya girmez. Giriş yap, listede yerini al.',
      scEst:'tahmini',scCountry:'Ülke',scSign:'Giriş yap',scTop:'En iyi 20'},
    en:{tabRm:'Rooms',tabSc:'Scores',rmWait:'Games waiting for an opponent',scWorld:'World',scLoad:'Loading scores…',scErr:'Scores could not be loaded. Try again shortly.',
      scNone:'Nobody here yet. Be the first!',scYou:'Your rank',scPts:'{p} pts',scGuest:'Guest points are not ranked. Sign in to take your place.',
      scEst:'estimated',scCountry:'Country',scSign:'Sign in',scTop:'Top 20'}
  };
  // sekme adları (öbür diller; kalan yazılar İngilizceye düşer)
  const TABS={de:['Räume','Bestenliste','Welt'],fr:['Salons','Classement','Monde'],es:['Salas','Clasificación','Mundo'],pt:['Salas','Ranking','Mundo'],it:['Stanze','Classifica','Mondo'],
    nl:['Kamers','Ranglijst','Wereld'],pl:['Pokoje','Ranking','Świat'],ro:['Camere','Clasament','Lume'],hu:['Szobák','Ranglista','Világ'],cs:['Místnosti','Žebříček','Svět'],
    sv:['Rum','Topplista','Världen'],el:['Δωμάτια','Κατάταξη','Κόσμος'],bg:['Стаи','Класация','Свят'],sr:['Собе','Ранг листа','Свет'],hr:['Sobe','Ljestvica','Svijet'],
    uk:['Кімнати','Рейтинг','Світ'],ru:['Комнаты','Рейтинг','Мир'],az:['Otaqlar','Reytinq','Dünya'],uz:['Xonalar','Reyting','Dunyo'],kk:['Бөлмелер','Рейтинг','Әлем'],
    ar:['الغرف','الترتيب','العالم'],fa:['اتاق‌ها','رتبه‌بندی','جهان'],he:['חדרים','דירוג','עולם'],ku:['Ode','Rêzbendî','Cîhan'],ka:['ოთახები','რეიტინგი','მსოფლიო'],
    hy:['Սենյակներ','Վարկանիշ','Աշխարհ'],hi:['कमरे','स्कोर','दुनिया'],bn:['রুম','স্কোর','বিশ্ব'],ur:['کمرے','اسکور','دنیا'],id:['Ruang','Peringkat','Dunia'],
    ms:['Bilik','Kedudukan','Dunia'],th:['ห้อง','อันดับ','โลก'],vi:['Phòng','Xếp hạng','Thế giới'],tl:['Mga silid','Ranggo','Mundo'],zh:['房间','排行榜','全球'],
    ja:['ルーム','ランキング','世界'],ko:['방','순위','세계'],sw:['Vyumba','Alama','Dunia']};
  if(typeof I18N==='object'){
    Object.assign(I18N.tr,L.tr);if(I18N.en)Object.assign(I18N.en,L.en);
    for(const [k,v] of Object.entries(TABS))if(I18N[k])Object.assign(I18N[k],{tabRm:v[0],tabSc:v[1],scWorld:v[2]});
  }

  const css=document.createElement('style');
  css.textContent=`
#home .htabs{display:flex;gap:4px;padding:0;margin:0 0 2px}
#home .htabs button{flex:1;min-width:0;min-height:42px;display:flex;align-items:center;justify-content:center;gap:4px;padding:4px 3px;border-radius:11px;
  font-family:"Fredoka",var(--body);font-size:13.5px;font-weight:700;letter-spacing:.01em;white-space:nowrap}
#home .htabs button:not(.on){background:var(--row,rgba(0,0,0,.18));border:1px solid var(--row-line,rgba(255,255,255,.08));color:var(--fg)}
#home .htabs button .ico{width:15px;height:15px;flex:none}
#home .htabs button span{overflow:hidden;text-overflow:ellipsis}
#home .opts[hidden]{display:none}
#home #optRm .og-r .ol{grid-column:1/-1}
#home .scSeg{display:flex;gap:4px}
#home .scSeg button{flex:1;min-width:0;min-height:38px;border-radius:10px;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:4px 6px}
#scList{display:flex;flex-direction:column;gap:5px;max-height:420px;overflow-y:auto;overscroll-behavior:contain}
.scw{flex:none;display:flex;align-items:center;gap:8px;padding:5px 9px 5px 6px;border-radius:12px;background:var(--surface);border:1px solid var(--line);color:var(--fg)}
.scw .scn{flex:none;width:30px;text-align:center;font:800 15px/1 system-ui,sans-serif;font-variant-numeric:tabular-nums;color:var(--muted)}
.scw .scn.md{font-size:20px}
.scw .av{width:34px;height:34px;flex:none;border-radius:50%;overflow:hidden;border:2px solid var(--accent);background:var(--surface)}
.scw .rmi b{font-size:14px}
.scw .scp{flex:none;font:800 14px/1 system-ui,sans-serif;font-variant-numeric:tabular-nums;text-align:right}
.scw.me{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
#scMe .scw{padding:8px 10px 8px 6px;border:2px solid var(--accent);background:color-mix(in srgb,var(--accent) 22%,var(--surface));box-shadow:0 0 18px color-mix(in srgb,var(--accent) 70%,transparent)}
#scMe .scw .scn{color:var(--fg);font-size:17px;width:auto;min-width:30px}
#scMe .scw .scn small{display:block;font:600 9.5px/1.2 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;opacity:.8;margin-top:2px}
#scMe .scw .av{width:40px;height:40px}
#scMe .scg{margin:6px 2px 0;font-size:12.5px;line-height:1.35;color:var(--muted);display:flex;align-items:center;gap:8px}
#scMe .scg span{flex:1}
#scMe .scg button{flex:none;min-height:34px;padding:2px 12px;border-radius:10px;font-weight:800;font-size:13px;color:var(--accent-fg)!important;background:var(--pri-bg,var(--accent))!important;border:0}
@media (prefers-reduced-motion:no-preference){#scMe .scw{animation:scGlow 1.8s ease-in-out infinite alternate}}
@keyframes scGlow{from{box-shadow:0 0 6px color-mix(in srgb,var(--accent) 45%,transparent)}to{box-shadow:0 0 22px color-mix(in srgb,var(--accent) 90%,transparent)}}
#home .scCc{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--muted)}
#home .scCc select{flex:1;min-width:0;font:inherit;font-size:14px;color:var(--fg);background:var(--row,rgba(0,0,0,.18));border:1px solid var(--line);border-radius:10px;padding:6px 8px}
#home .scCc select option{color:#111;background:#fff}
:root[data-theme=arcade] #home .htabs button:not(.on){background:#fff;color:#111;border-color:#000}
:root[data-theme=arcade] #home .rmE{color:#444}
:root[data-theme=arcade] .scw{background:#fff;color:#111;border:2px solid #000}:root[data-theme=arcade] .scw .scn,:root[data-theme=arcade] .scw .rmi small{color:#444}
:root[data-theme=arcade] #scMe .scw{background:#fff6bf;border-color:#000;box-shadow:4px 4px 0 #000;animation:none}
:root[data-theme=arcade] #scMe .scw .scn{color:#111}
:root[data-theme=arcade] #home .scSeg button:not(.on){background:#fff;color:#111}
:root[data-theme=arcade] #home .scCc{color:#333}:root[data-theme=arcade] #home .scCc select{background:#fff;color:#111;border-color:#000}
:root[data-theme=sunset] .scw{background:#fff8f2}:root[data-theme=sunset] #home .htabs button:not(.on),:root[data-theme=sunset] #home .scSeg button:not(.on){background:#fff8f2}
:root[data-theme=sunset] #home .scCc select{background:#fff}
:root[data-theme=poker] #scMe .scw{background:color-mix(in srgb,#e7c66b 20%,#0e3a28);border-color:#e7c66b;box-shadow:0 0 18px rgba(231,198,107,.6)}
@media (prefers-reduced-motion:no-preference){:root[data-theme=poker] #scMe .scw{animation:scGold 1.8s ease-in-out infinite alternate}}
@keyframes scGold{from{box-shadow:0 0 6px rgba(231,198,107,.35)}to{box-shadow:0 0 22px rgba(231,198,107,.85)}}
`;
  document.head.appendChild(css);

  const IC={
    opt:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="7" r="2.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2.2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    rm:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10l8-6 8 6v10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    sc:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v3M8 20h8M10 17h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  const TABK={opt:'opts',rm:'tabRm',sc:'tabSc'};
  const tabsHtml=()=>`<div class="seg htabs" role="tablist">${['opt','rm','sc'].map(k=>`<button type="button" role="tab" data-htab="${k}">${IC[k]}<span>${escH(i18(TABK[k]))}</span></button>`).join('')}</div>`;

  let tab='opt',scope='c';
  function build(){
    const on=$('#optOn'),cpu=$('#optCpu');if(!on||!cpu||$('#optSc'))return;
    [cpu,on].forEach(p=>{const h=p.querySelector('.sh2');if(h)h.outerHTML=tabsHtml();else p.insertAdjacentHTML('afterbegin',tabsHtml());});
    on.insertAdjacentHTML('afterend',`<div class="opts" id="optRm" hidden>${tabsHtml()}</div><div class="opts" id="optSc" hidden>${tabsHtml()}`+
      `<div class="seg scSeg" role="radiogroup"><button type="button" data-sc="c"></button><button type="button" data-sc="w"></button></div>`+
      `<div id="scList" aria-live="polite"></div><div id="scMe"></div>`+
      `<label class="scCc"><span></span><select id="scCc"></select></label></div>`);
    const rm=$('#optRm');
    ['.og-r','.og-j'].forEach(s=>{const e=on.querySelector(s);if(e)rm.appendChild(e);});
    const rl=rm.querySelector('.og-r .ol');if(rl)rl.dataset.i='rmWait';
    // Odalar sekmesinden katılınca mod Arkadaşınla olur (OYUNA DEVAM ET odaya döner)
    rm.addEventListener('click',e=>{if(e.target.closest('.rmj,#bJoin')&&HM!=='on'&&typeof setHM==='function')setHM('on');},true);
    $('#home').addEventListener('click',e=>{
      const b=e.target.closest('[data-htab]');if(b){try{audio();}catch(x){}setTab(b.dataset.htab);return;}
      const s=e.target.closest('[data-sc]');if(s){try{audio();}catch(x){}scope=s.dataset.sc;lsSet('tavla_scs',scope);paintSc();load();return;}
      if(e.target.closest('#scSign')){const g=$('#bSet');if(g)g.click();}
    });
    $('#scCc').addEventListener('change',e=>{const c=e.target.value;if(!okCC(c))return;lsSet('tavla_cc',c);cache={};paintSc();load();pub();});
    const s0=lsGet('tavla_scs','c');scope=s0==='w'?'w':'c';
  }
  function setTab(t){tab=TABK[t]?t:'opt';paint();}
  // görünür kutu: sekme + mod (index.html setHM her değişimde çağırır)
  function paint(){
    const cpu=$('#optCpu'),on=$('#optOn'),rm=$('#optRm'),sc=$('#optSc');if(!sc)return;
    cpu.hidden=!(tab==='opt'&&HM==='cpu');on.hidden=!(tab==='opt'&&HM!=='cpu');rm.hidden=tab!=='rm';sc.hidden=tab!=='sc';
    document.querySelectorAll('#home .htabs').forEach(h=>h.querySelectorAll('button').forEach(b=>{const o=b.dataset.htab===tab;b.classList.toggle('on',o);b.setAttribute('aria-selected',String(o));
      const sp=b.querySelector('span');if(sp)sp.textContent=i18(TABK[b.dataset.htab]);}));
    const rl=rm.querySelector('.og-r .ol');if(rl)rl.textContent=i18('rmWait');
    // oda mesajı (katılma hatası, odadan atıldın…) görünen kutuda dursun
    const lm=$('#lobbyMsg'),vis=[cpu,on,rm,sc].find(p=>!p.hidden);if(lm&&vis&&lm.parentNode!==vis)vis.appendChild(lm);
    if(tab==='sc'){paintSc();load();}
    if(typeof lbWatch==='function')lbWatch(); // oda listesi yalnız Odalar sekmesinde izlenir
  }

  /* ---------- skor tablosu ---------- */
  const base=()=>String(window.__DBURL||'https://e-tavla-default-rtdb.europe-west1.firebasedatabase.app').replace(/\/+$/,'');
  async function req(method,path,body,qs){
    let q=qs||'';if(window.__DBNS)q+=(q?'&':'')+'ns='+window.__DBNS;
    if(method!=='GET'){const t=window.ACCT?await ACCT.idToken():'';if(!t)throw new Error('auth');q+=(q?'&':'')+'auth='+encodeURIComponent(t);}
    const r=await fetch(base()+'/'+path.split('/').map(encodeURIComponent).join('/')+'.json'+(q?'?'+q:''),
      {method,headers:body!==undefined?{'Content-Type':'application/json'}:undefined,body:body!==undefined?JSON.stringify(body):undefined});
    if(!r.ok)throw new Error('http '+r.status);
    return r.json();
  }
  const OB='orderBy='+encodeURIComponent('"xp"');
  const lbPath=s=>s==='w'?'lb/w':'lb/c/'+myCC();
  const me=()=>{const u=window.ACCT&&ACCT.user;return u&&NAME&&!/^GUEST/.test(ACCT.nk(NAME))?u.uid:'';};
  const myXp=()=>Math.max(0,Math.floor(+XP.xp||0));
  let cache={},busy={};
  const CNT=1000; // sıra sayımında en çok bu kadar kayıt indirilir; üstü "1000+"
  async function load(force){
    const s=scope,p=lbPath(s),c=cache[p];
    if(!force&&c&&!c.err&&Date.now()-c.at<30000)return;
    if(busy[p])return;busy[p]=1;
    try{
      if(!c)paintSc();
      const top=await req('GET',p,undefined,OB+'&limitToLast=20');
      const rows=Object.keys(top||{}).map(id=>Object.assign({id},deHtml(top[id]||{}))).filter(r=>r&&typeof r.n==='string')
        .sort((a,b)=>(+b.xp||0)-(+a.xp||0)||(+a.t||0)-(+b.t||0));
      const uid=me(),xp=myXp();let rank=0,more=false;
      const i=uid?rows.findIndex(r=>r.id===uid):-1;
      if(i>=0)rank=i+1;
      else if(rows.length<20||xp>(+rows[rows.length-1].xp||0)){rank=rows.filter(r=>(+r.xp||0)>xp).length+1;}
      else{const up=await req('GET',p,undefined,OB+'&startAt='+(xp+1)+'&limitToFirst='+CNT);const n=Object.keys(up||{}).filter(k=>k!==uid).length;rank=n+1;more=n>=CNT;}
      cache[p]={rows,rank,more,at:Date.now()};
    }catch(e){cache[p]={err:true,at:Date.now()};}
    finally{busy[p]=0;}
    if(lbPath(scope)===p)paintSc();
  }
  const nf=v=>{try{return (+v||0).toLocaleString(ULOC());}catch(e){return String(+v||0);}};
  const MED=['🥇','🥈','🥉'];
  function row(r,n,mine){
    const lv=lvOf(+r.xp||0).l,av=AVATARS[+r.av]||AVATARS[0]||'';
    return `<div class="scw${mine?' me':''}"><b class="scn${n<=3?' md':''}">${n<=3?MED[n-1]:n}</b><span class="av">${av}</span>`+
      `<span class="rmi"><b>${escH(UP(seeName(r.n))||i18('player'))}</b><small>${escH(i18('lvS',{n:lv}))} · ${escH(lvTitle(lv))}</small></span>`+
      `<b class="scp">${escH(nf(r.xp))}</b></div>`;
  }
  function paintSc(){
    const box=$('#optSc');if(!box||box.hidden)return;
    const cc=myCC();
    box.querySelectorAll('[data-sc]').forEach(b=>{const o=b.dataset.sc===scope;b.classList.toggle('on',o);b.setAttribute('aria-checked',String(o));
      b.textContent=b.dataset.sc==='w'?'🌍 '+i18('scWorld'):flag(cc)+' '+ccName(cc);});
    const sel=$('#scCc');
    if(sel.dataset.l!==ULOC()+cc){sel.dataset.l=ULOC()+cc;
      sel.innerHTML=CCS.map(c=>[c,ccName(c)]).sort((a,b)=>a[1].localeCompare(b[1],ULOC())).map(([c,n])=>`<option value="${c}"${c===cc?' selected':''}>${flag(c)} ${escH(n)}</option>`).join('');}
    sel.value=cc;box.querySelector('.scCc span').textContent=i18('scCountry');
    const el=$('#scList'),mb=$('#scMe'),d=cache[lbPath(scope)];
    if(!d){el.innerHTML=`<p class="rmE">${escH(i18('scLoad'))}</p>`;mb.innerHTML='';return;}
    if(d.err){el.innerHTML=`<p class="rmE">${escH(i18('scErr'))}</p>`;mb.innerHTML='';return;}
    const uid=me();
    el.innerHTML=d.rows.length?d.rows.map((r,i)=>row(r,i+1,uid&&r.id===uid)).join(''):`<p class="rmE">${escH(i18('scNone'))}</p>`;
    const rk=d.more?nf(d.rank-1)+'+':(uid?'':'~')+nf(d.rank);
    mb.innerHTML=`<div class="scw"><b class="scn">${rk}.<small>${escH(uid?i18('scYou'):i18('scEst'))}</small></b><span class="av">${AVATARS[AV]||''}</span>`+
      `<span class="rmi"><b>${escH(UP(NAME)||i18('player'))}</b><small>${escH(i18('lvS',{n:myLv()}))} · ${escH(lvTitle(myLv()))}</small></span><b class="scp">${escH(nf(myXp()))}</b></div>`+
      (uid?'':`<p class="scg"><span>${escH(i18('scGuest'))}</span><button type="button" id="scSign">${escH(i18('scSign'))}</button></p>`);
  }

  // girişli oyuncunun kaydı (ad, avatar, puan, ülke); profil değişince account.js çağırır
  let pubT=null;
  function pub(){
    clearTimeout(pubT);
    pubT=setTimeout(async()=>{
      const uid=me();if(!uid)return;
      const cc=myCC(),e={n:cleanName(NAME).slice(0,14),av:AV,xp:myXp(),t:Date.now()},old=lsGet('tavla_lbc',null);
      try{
        await req('PUT','lb/w/'+uid,Object.assign({c:cc},e));
        await req('PUT','lb/c/'+cc+'/'+uid,e);
        if(old&&old!==cc)req('DELETE','lb/c/'+old+'/'+uid).catch(()=>{});
        lsSet('tavla_lbc',cc);cache={};if(tab==='sc')load();
      }catch(x){}
    },800);
  }
  // hesap silinirken skor kayıtları da silinir
  async function drop(){
    const u=window.ACCT&&ACCT.user;if(!u)return;
    const old=lsGet('tavla_lbc',null);
    await Promise.all([req('DELETE','lb/w/'+u.uid),req('DELETE','lb/c/'+(okCC(old)?old:myCC())+'/'+u.uid)].map(p=>p.catch(()=>{})));
    lsSet('tavla_lbc',null);
  }

  window.SKOR={paint,pub,drop,load,setTab,get tab(){return tab;},cc:myCC};
  build();paint();
})();
