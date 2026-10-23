# Tavla Masası: grafik ihtiyaç listesi

Bu liste, ChatGPT'nin hazırlayacağı grafik paketleri için teslim şartlarını içerir. Dosyaları Claude Code mevcut sisteme bağlayacak. Liste `main` dalının **633292a** sürümüne göre hazırlandı. Bu çalışmada kod ya da grafik değiştirilmedi.

Kısaltmalar:
- **Durum** sütunu:
  - **Yok**: oyunda bu görsel hiç yok; kod ya da CSS ile çizilmiş bir yedek kullanılıyor.
  - **Var (v2)**: Premium Asset v2 paketinden gelen bir SVG kullanılıyor; daha iyisiyle değiştirilebilir.
- **Bağlantı** sütunu: dosyanın bağlanacağı fonksiyon ya da bileşen. Satır numaraları `index.html` içindir.

## 0. Ortak kurallar

- **Klasörler**
  - `assets/<tema>/`: temaya özgü dosyalar. `<tema>` şunlardan biri: `neon`, `sunset`, `poker`, `arcade`.
  - `assets/common/`: tüm temalarda ortak dosyalar.
  - Adlar küçük harf ve kısa çizgiyle yazılır.
  - **Aynı ad korunursa kod değişmeden dosya değiştirilebilir.**
- **Biçim**
  - Tahta üzerindeki her şey için vektör (**SVG**) tercih edilir. Tahta büyüyüp küçüldüğü için SVG her ekranda keskin kalır.
  - Fotoğraf gerçekliğinde doku gerekiyorsa **WebP** verilmeli; aynı ölçüde **PNG** yedeği de gelmeli (iOS 14 öncesi için).
  - SVG kuralları:
    - metin içermez
    - `viewBox` tanımlıdır
    - dış kaynak çağırmaz
    - `<image>` içinde gömülü PNG (base64) olmaz
    - kimlikleri (`id`) yalnızca o dosyaya özgüdür
- **Çözünürlük:** iPhone için 3x. Aşağıdaki piksel ölçüleri oyun birimlerinin 3 katıdır.
- **Animasyonlar:** **yatay sprite sheet** (WebP + PNG yedeği, şeffaf). Kare sayısı ve kare ölçüsü dosya adında yazılır, örneğin `fx-hit-12x384.webp`.
  - Döngü animasyonlarında ilk ve son kare birbirine bağlanmalıdır.
  - Lottie ya da video istenirse ayrıca konuşulmalıdır, çünkü ek kütüphane gerekir.
- **Yazı:** Slogan, isim, buton etiketi ve sayı **görsele gömülmez**. Oyun 40'tan fazla dilde çalışıyor; yazıları kod basıyor. Tek istisna logodur.
- **Boyut:** tema başına en fazla 1,5 MB. Oyun çevrimdışı çalıştığı için dosyalar `sw.js` önbelleğine eklenir.
- **Renk:** Pullar dört temada da beyaz ve kırmızı kalır (onaylı karar).

## 1. Tahta geometrisi

Tahta görselleri bu koordinatlara birebir oturmalıdır. Dokunma alanları kodda kalır.

- Tahta gövdesi: **410 × 400 birim**, yani **1230 × 1200 px**.
- Ekrandaki SVG `viewBox="0 -3 410 406"`. Üst ve altta 3'er birim pay var.

| Bölge | x | y | genişlik × yükseklik |
|---|---|---|---|
| Dış çerçeve | 0 | 0 | 410 × 400 (köşe yarıçapı 10) |
| Sol toplama kanalı | 6 | 6 | 26 × 388 (üst yarı rakibin, alt yarı oyuncunun) |
| Oyun alanı | 34 | 6 | 368 × 388 |
| Orta bar | 204 | 6 | 28 × 388 |
| Üçgen sütunları | sol yarı: `36 + 28·i`, sağ yarı: `232 + 28·i` (i = 0…5) | üst: 8 → 178, alt: 392 → 222 | taban 26, boy 170 |
| Pul | — | — | yarıçap 12,5 (çap 25) |

## 2. Öncelik sırası ve dosyalar

### 2.1 Profesyonel Tavla Masası logosu (öncelik 1)

| Dosya | Biçim, ölçü | Şeffaf | Ekran / olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/common/logo.webp` + `logo.png` | 1080 × 420 | Evet | Giriş ekranı başlığı | Yok. İsteğe bağlı: 8 karelik parıltı geçişi `logo-shine-8x1080.webp` | `theme/themes.js` → `home.logo`; `homeArt()` (satır 1619), `#lgImg` | Yok (CSS yazısı) |
| `assets/<tema>/logo.webp` (isteğe bağlı) | 1080 × 420 | Evet | Logonun temaya göre renk varyantı | Yok | Aynı yuva; verilirse ortak logonun yerine geçer | Yok |
| `assets/common/app-icon.png` | 1024 × 1024 | Hayır | Ana ekran simgesi (PWA) | Yok | `manifest.webmanifest`, `apple-touch-icon.png` (180 × 180), `icon-192.png`, `icon-512.png` bundan türetilir | Var (basit) |

### 2.2 Sinematik giriş ekranı arka planları (öncelik 2)

| Dosya | Biçim, ölçü | Şeffaf | Ekran / olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/<tema>/home-bg.webp` + `.jpg` | 1290 × 2796 | Hayır | Giriş ekranı arka planı | Yok. Parçacıklar ayrıca verilir (2.9). | `home.bg` → CSS `--home-bg` (`homeArt()`) | Yok (düz renk/degrade) |
| `assets/<tema>/game-bg.webp` + `.jpg` | 1290 × 2796 | Hayır | Oyun ekranı arka planı; tahtanın çevresi | Yok | Yeni yuva: `home.gameBg` → `body` arka planı. Bağlanması küçük bir CSS işi. | Yok (düz renk) |

Kurallar:
- Üst 160 px ve alt 120 px güvenli alandır (çentik ve ana ekran çubuğu); önemli öğe konmaz.
- Orta bölge sakin olmalı, çünkü paneller ve tahta üstüne gelir.

### 2.3 Dekoratif 3B tavla masası (öncelik 3)

| Dosya | Biçim, ölçü | Şeffaf | Ekran / olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/<tema>/home-table.webp` + `.png` | 1170 × 560 | Evet | Giriş ekranı, mod kartlarıyla seçenekler arasındaki tahta. Sağa/sola kaydırınca tema değişir. | Yok. İsteğe bağlı: 12 karelik hafif ışık döngüsü | `home.table` → `#heroImg`; `heroPaint()` (satır 1625). Verilince SVG yedeği kapanır. | Yok (v2 SVG'lerinden perspektifli yedek) |

Kurallar:
- Dört tema aynı açı ve aynı ölçüde çizilmeli; tema geçişinde masa yerinden kaymamalı.
- Zarlar görselin içinde olabilir. Kod şu an iki zar çiziyor (`.hd1`, `.hd2`); görsel zarlı gelirse bunlar kapatılır.

### 2.4 Oyun tahtası dokuları ve çerçeveleri (öncelik 4)

| Dosya | Biçim, ölçü | Şeffaf | Ekran / olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/<tema>/board-field.svg` (ya da `.webp` 1230 × 1200) | `viewBox 0 0 410 400` | Hayır | Oyun alanı zemini; orta bar ve kanalın arkası dahil | Yok | `render()` → ilk `<image>` katmanı | Var (v2) |
| `assets/<tema>/board-frame.svg` (ya da `.webp`) | `viewBox 0 0 410 400` | Evet (oyun alanı boş) | Dış çerçeve, orta bar, toplama kanalı | Yok | `render()` → çerçeve katmanı, pulların altında | Var (v2) |
| `assets/<tema>/points.svg` | `viewBox 0 0 54 170`; `#pa`/`#pb` degradeleri, `#pt-a`/`#pt-b` konturu | Evet | 24 üçgenin rengi ve kenarı | Yok | `loadAssets()` (satır 1662) → `tri()` | Var (v2) |

**Kanal ve bar notu:** Çerçeve şu an pulların altında çiziliyor, çünkü v2 çerçevesi kanalı ve barı dolu boyuyor. Yeni çerçevede kanal (x 6–32) ve bar (x 204–232) içi **koyu ve sade** olmalı; toplanmış ve kırık pullar onların üstünde görünür.

### 2.5 Premium beyaz/kırmızı pullar (öncelik 5)

| Dosya | Biçim, ölçü | Şeffaf | Ekran / olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/<tema>/checker-light.svg` | `viewBox 0 0 96 96`; disk merkezi (48,46), yarıçap 43 | Evet | Oyuncu pulları (beyaz) | Yok | `loadAssets()` → `#ckL` sembolü; `checker()` (satır 1881) | Var (v2) |
| `assets/<tema>/checker-dark.svg` | aynı | Evet | Rakip pulları (kırmızı) | Yok | `#ckD` | Var (v2) |
| `assets/<tema>/checker-off-light.svg`, `checker-off-dark.svg` | `viewBox 0 0 22 7` | Evet | Toplama kanalındaki yan görünen pul çubukları | Yok | Yeni yuva; `render()` satır ~2108 (şu an CSS degrade dikdörtgen) | Yok |
| `assets/<tema>/checker-select.svg` | `viewBox 0 0 96 96` | Evet | Seçili pulun halkası | 8 kare nabız (isteğe bağlı) | Yeni yuva; şu an `hi` rengiyle halka | Yok |

### 2.6 Zar ve ZAR AT düğmesi (öncelik 6)

| Dosya | Biçim, ölçü | Şeffaf | Ekran / olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/<tema>/dice-faces.svg` | 6 sembol `#d1`…`#d6`, her biri `viewBox 0 0 64 64` | Hayır | Zarın yüzleri | Yok; dönüşü kod yapar | `cubeSVG()` (satır 1488), `drawDice()` (satır 1829) | Yok (kod çizimi) |
| `assets/<tema>/btn-roll.svg` | `viewBox 0 0 220 96`, yazısız | Evet | Tahtanın ortasındaki ZAR AT düğmesi | İsteğe bağlı: 12 karelik parıltı `btn-roll-glow-12x660.webp` | `#rbB` sembolü; `render()` | Var (v2) |
| `assets/<tema>/dice-shadow.svg` (isteğe bağlı) | `viewBox 0 0 64 64` | Evet | Zarın masadaki gölgesi | Yok | `drawDice()` | Yok (radyal degrade) |

**Önemli:** ZAR AT düğmesi orta barın üstüne geliyor ve bardaki kırık rakip pulu kapatıyor (bkz. denetim raporu, sorun 1). Yeni düğme ya **daha alçak** olmalı (en fazla 64 birim yükseklik) ya da kod düğmeyi bardan kaydıracak.

### 2.7 Avatar çerçeveleri ve avatarlar (öncelik 7)

| Dosya | Biçim, ölçü | Şeffaf | Ekran / olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/<tema>/avatar-ring.svg` | `viewBox 0 0 64 64`, iç çap 52 | Evet | Üst bölümdeki iki avatarın çerçevesi | Yok. Yeşil/kırmızı süre halkasını kod çizer (`.tring`). | `.aring` görseli; `ringPaint()` (satır 2238) | Var (v2) |
| `assets/common/avatars/av-01.webp` … `av-12.webp` | 256 × 256 | Hayır (kare; kod daire içine kırpar) | Oyuncu avatarları; isim girerken seçilir | Yok | `assets/avatars.js` → `TAVLA_AVATARS` (sıra korunmalı) | Var (6 geçici çizim) |
| `assets/common/avatars/av-cpu.webp` | 256 × 256 | Hayır | BuBi (bilgisayar rakibi) | İsteğe bağlı: 8 karelik "düşünüyor" döngüsü | `TAVLA_AVATAR_CPU` | Var (geçici robot) |

### 2.8 Üstünlük barı (öncelik 8)

| Dosya | Biçim, ölçü | Şeffaf | Ekran / olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/<tema>/adv-bar-track.svg` | `viewBox 0 0 300 16` | Evet | Üst bölümdeki canlı üstünlük barının kabı | Yok | `loadAssets()` → `#abTrack`; `wpPaint()` (satır 1910) | Var (v2) |
| `assets/<tema>/adv-bar-fill.svg` | `viewBox 0 0 300 16`; `#fill-me`, `#fill-opp` | Evet | Oyuncu ve rakip dolguları | Yok; genişliği kod ayarlar | Yeni yuva (şu an tema rengi CSS degradesi) | Yok |
| `assets/<tema>/adv-bar-spark.webp` | 8 kare × 48 × 48 → 384 × 48 | Evet | İki dolgunun birleştiği noktadaki kıvılcım | 8 kare döngü | Yeni yuva; `wpPaint()` | Yok |

### 2.9 Kapı alevleri, elektrik ve özel efektler (öncelik 9)

Tüm efektler **yazısızdır**. Sloganları (DUVAR ÖRÜLDÜ!, ÇIKIŞ YOK! vb.) kod basar.

| Dosya | Biçim, ölçü | Şeffaf | Olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/<tema>/fx-closed-point.svg` | `viewBox 0 0 26 170` | Evet | 6 iç kapı kapalı + rakip kırık: her kapalı üçgenin üstünde | CSS ile nabız | `#fxC`; `render()` satır ~2065 (`.bz`) | Var (v2, soluk) |
| `assets/<tema>/fx-closed-loop-12x78x510.webp` | 12 kare, kare 78 × 510 → 936 × 510 | Evet | Aynı olay; sprite verilirse SVG'nin yerine geçer | 12 kare döngü | Aynı yer | Yok |
| `assets/<tema>/fx-hit-12x384.webp` | 12 × 384 × 384 | Evet | Rakip pulu kırma ("YAKALADIM SENİ!") | 12 kare, tek sefer | `moment('hit')` (satır 1745) | Yok |
| `assets/<tema>/fx-made-12x384.webp` | aynı | Evet | İç alanda kapı alma ("DUVAR ÖRÜLDÜ!") | 12 kare | `moment('made')` | Yok |
| `assets/<tema>/fx-double-12x384.webp` | aynı | Evet | Çift zar ("HOPP! ÇİFTE GELDİ!") | 12 kare | `moment('double')` | Yok |
| `assets/<tema>/fx-swing-12x384.webp` | aynı | Evet | Büyük üstünlük değişimi ("OYUN DÖNDÜ!") | 12 kare | `moment('swing')` | Yok |
| `assets/<tema>/fx-mars-risk-12x384.webp` | aynı | Evet | Mars riski ("MARS GELİYOR!") | 12 kare | `moment('marsRisk')` | Yok |
| `assets/<tema>/fx-particles-24x390x844.webp` (isteğe bağlı) | 24 kare, kare 390 × 844 | Evet | Giriş ekranında hafif parçacık ya da ışık döngüsü | 24 kare döngü | Yeni katman, `#home` arkası | Yok |

Tema yorumları:
- Neon: elektrik ve neon kıvılcım
- Sunset: alev ve güneş parıltısı
- Poker: altın ışık ve fiş
- Arcade: çizgi roman patlaması ve şimşek

### 2.10 Galibiyet ve mars animasyonları (öncelik 10)

| Dosya | Biçim, ölçü | Şeffaf | Olay | Animasyon | Bağlantı | Durum |
|---|---|---|---|---|---|---|
| `assets/<tema>/fx-win-16x512.webp` | 16 × 512 × 512 | Evet | Galibiyet ("TEBRİKLER!"): kupa ve patlama | 16 kare, tek sefer | `moment('win')`, `showResult()` (satır 1010) | Yok |
| `assets/<tema>/fx-mars-16x512.webp` | aynı | Evet | Mars ("MAAARS!") | 16 kare | `moment('mars')` | Yok |
| `assets/<tema>/fx-confetti-24x390x844.webp` | 24 kare, kare 390 × 844 | Evet | Maç sonu ekran konfetisi | 24 kare, tek sefer | `showResult()` | Yok |
| `assets/<tema>/result-panel.svg` (isteğe bağlı) | 9 dilim, `viewBox 0 0 96 96`, kenar 32 | Evet | "Maçı kazandın" penceresinin zemini | Yok | `#ovBox` | Yok (CSS) |

## 3. Arayüz simgeleri (ortak)

| Dosya | Biçim | Kullanım | Bağlantı | Durum |
|---|---|---|---|---|
| `assets/common/icons.svg` | sembol seti, her biri `viewBox 0 0 24 24` | zil, ayarlar, bilgisayar, iki kişi, ok, seviye, set, saat, oynat, palet, bayrak (çekil), ses açık/kapalı, mikrofon, gönder, geri al | Giriş ekranı simgeleri ve oyun içi düğmeler | Yok (basit yedek simgeler ve emoji) |

## 4. Sesler (grafik paketiyle birlikte istenirse)

Sesler zorunlu değil. Verilmeyen ses, mevcut sentez sesiyle kalır.

Mevcut kayıtlar:
- `binf`: rakibin toplamaya başlaması
- `oh`: kırık
- `assets/sfx/kirik-coklu.mp3`: 2. ve sonraki kırıklar

Kurallar:
- Biçim: M4A ya da MP3, mono, 44,1 kHz
- Uzunluk ≤ 1,5 sn, dosya ≤ 60 KB
- Ticari kullanıma uygun lisans
- Liste: [docs/art/VARLIK_LISTESI.md](art/VARLIK_LISTESI.md) §4 ve §7

## 5. Teslim kontrol listesi (her paket için)

- [ ] Dosya adları ve klasörler bu listedeki gibi
- [ ] SVG'lerde `viewBox` doğru, metin yok, gömülü PNG yok
- [ ] WebP dosyalarının PNG yedeği var
- [ ] Şeffaf olması gerekenler şeffaf
- [ ] Sprite sheet kare sayısı ve ölçüsü dosya adında
- [ ] Dört temanın aynı adlı dosyaları aynı ölçüde
- [ ] Tema başına toplam ≤ 1,5 MB
