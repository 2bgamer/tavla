# Tavla Masası: görsel ve ses varlık listesi

Onaylı tasarım konseptine göre hazırlanmıştır (dört tema, üstünlük barı, avatarlar, hamle sonrası efektler). Varlıkları ChatGPT üretecek; oyun koduna entegrasyon Claude Code tarafından yapılacak. Bu listede yeni tasarım yoktur; yalnızca konseptteki öğelerin hangi dosyalar olarak, hangi ölçü ve kurallarla teslim edileceği yazılıdır.

## 0. Ortak kurallar

- **Klasörler**
  - `assets/<tema>/…`: temaya özgü dosyalar. `<tema>` şunlardan biri: `neon`, `sunset`, `poker`, `arcade`.
  - `assets/common/…`: tüm temalarda ortak dosyalar.
- **Adlandırma:** küçük harf ve kısa çizgi. Örnek: `assets/neon/board-frame.webp`.
- **Biçimler**
  - Fotoğraf ya da resim gibi dokular: **WebP**, aynı ölçüde bir **PNG** yedeğiyle (iOS 14 öncesi için).
  - Düz çizimler ve simgeler: **SVG**, metin içermeyen, `viewBox` tanımlı.
  - Animasyonlar: **sprite sheet** (yatay şerit, WebP/PNG, şeffaf). Kare sayısı ve kare ölçüsü dosya adında yazsın, örneğin `fx-hit-12x512.webp`. Lottie istenirse ayrıca konuşulmalı, çünkü ~250 KB'lık ek kütüphane gerekir.
  - Sesler: **M4A (AAC)** ve **OGG**. 44,1 kHz, mono, en fazla 1,5 sn, her dosya en fazla 60 KB, normalize (−1 dBFS tepe). Lisansı ticari kullanıma uygun olmalı; kaynak ve lisans `assets/LISANS.md`'ye yazılmalı.
- **Çözünürlük:** iPhone için 3x. Aşağıdaki ölçüler, oyunun SVG birimlerinin 3 katıdır.
- **Toplam boyut:** tema başına en fazla 1,5 MB. Uygulama çevrimdışı çalıştığı için dosyalar servis çalışanında önbelleğe alınacak.
- **Metin:** sloganlar ve arayüz yazıları **görsele gömülmesin**. Oyun 40'tan fazla dilde çalışıyor; yazılar kodla, temanın yazı tipiyle basılacak. Konseptteki slogan yazı stili (eğik, konturlu, gölgeli) CSS ile uygulanacak.

## 1. Tahta geometrisi (görseller buna birebir oturmalı)

Tahta SVG'si `viewBox="0 -34 410 468"`. Tahta gövdesi **410 × 400** birim. Görseller bu ölçünün 3 katında (**1230 × 1200 px**) teslim edilmeli.

| Bölge | x | y | genişlik × yükseklik |
|---|---|---|---|
| Dış çerçeve | 0 | 0 | 410 × 400 (köşe yarıçapı 10) |
| Oyun alanı (çuha) | 34 | 6 | 368 × 388 |
| Orta bar | 204 | 6 | 28 × 388 |
| Toplama kanalı (solda) | 6 | 6 | 26 × 388 |
| Üçgen (her biri) | sütun başı | üst: 8 → 178, alt: 392 → 222 | taban 26, boy 170 |

- Üçgen sütun x başlangıçları: sol yarı `36 + 28·i` (i = 0…5), sağ yarı `232 + 28·i`.
- Pul yarıçapı 12,5 birimdir (çap 25). Zarlar kodla 3B döndürülerek çiziliyor.
- **Dokunma alanları kodda kalacak.** Görseller yalnızca görünüm içindir. Üçgenler görsele gömülürse yukarıdaki koordinatlara tam oturmalıdır. Aksi hâlde üçgenler kodla çizilir ve görselden yalnızca renk ve doku alınır (önerilen).

## 2. Tema başına dosyalar (×4 tema)

| # | Dosya | Biçim, ölçü | Açıklama |
|---|---|---|---|
| T1 | `bg.webp` | 1290 × 2796 | Tam ekran arka plan sahnesi. Neon şehir/palmiye, gün batımı plajı, lounge, çizgi roman patlaması. Üst 160 px ve alt 120 px güvenli alanda önemli öğe olmasın. |
| T2 | `board-frame.webp` | 1230 × 1200, şeffaf | Dış çerçeve. Neon tüp ışık, ahşap, deri + altın, siyah konturlu çizgi roman. Ortası (oyun alanı) şeffaf. |
| T3 | `board-field.webp` | 1104 × 1164 (368 × 388 × 3) | Oyun alanı dokusu. Neon ızgara, palmiye baskılı ahşap, altın süslemeli yeşil çuha, "BAM!/WOW!" yazısız patlama şekilleri. Orta barın arkası dahil. |
| T4 | `bar.webp` | 84 × 1164 | Orta bar. Ayrı istenirse; T3'e dahil de olabilir. |
| T5 | `points.svg` | iki sembol: `#pt-a`, `#pt-b`, `viewBox 0 0 26 170` | Üçgen dolgu stilleri. Neon parlayan kenar, ahşap kakma, çuha işlemesi, kalın kontur. Kod bunları 24 noktaya yerleştirir. |
| T6 | `checker-light.webp`, `checker-dark.webp` | 96 × 96, şeffaf | Pullar (üstten görünüm, kendi gölgesi yok; gölgeyi kod çizer). **Not:** konseptte dört temada da beyaz ve kırmızı pul var; şu an temalarda farklı renkler kullanılıyor (bkz. 6. bölüm, karar 1). |
| T7 | `dice-faces.webp` | 6 kare × 192 px = 1152 × 192 | Zar yüzleri (1…6). Kod bunları 3B dönen küpün yüzlerine eşler. Kenar yuvarlaklığı ve gölge kodda. İsteğe bağlı: verilmezse mevcut zar çizimi tema renkleriyle kalır. |
| T8 | `avatar-ring.svg` | `viewBox 0 0 64 64` | Avatar çerçevesi. Neon halka, altın halka, yeşil halka, konturlu halka. |
| T9 | `adv-bar.svg` | `viewBox 0 0 300 16` | Üstünlük barı kabı ve iki dolgu (oyuncu/rakip). Ayrı `<g id>`'ler: `#track`, `#fill-me`, `#fill-opp`, `#glow`. |
| T10 | `fx-burn-loop-<kare>x<px>.webp` | 12 kare, her kare 84 × 510 | Tam kapı + rakip kırık durumu: her iç kapı üçgeninin üzerinde döngü efekti. Neon: elektrik, Sunset: alev, Poker: altın ışık, Arcade: elektrik/çizgi roman alevi. |
| T11 | `btn-roll.svg` | – | "ZAR AT" düğme zemini, iki zar simgesi dahil, yazısız. |
| T12 | `chat-panel.webp` | 9-dilim, 96 × 96 (kenar 32) | Sohbet paneli zemini (cam, ahşap, deri, çizgi roman). İsteğe bağlı; verilmezse CSS renkleri kalır. |

## 3. Ortak dosyalar

| # | Dosya | Biçim, ölçü | Açıklama |
|---|---|---|---|
| C1 | `avatars/av-01…av-12.webp` | 256 × 256 | Varsayılan avatar seti (konseptteki BURAK ve ARKADAŞ tarzında). Daire içine kırpılacak; yüz ortada. Bilgisayar rakibi için `av-cpu.webp`. |
| C2 | `icons.svg` | sembol seti, `viewBox 0 0 24 24` | sohbet, emoji, bayrak (çekil), üç nokta menü, gönder oku, zar, ses açık/kapalı, tema (palet). **Mikrofon simgesi konsepte var ama oyunda sesli mesaj özelliği yok** (bkz. karar 4). |
| C3 | Efekt animasyonları (tema başına renk varyantı ya da ortak) | sprite sheet, 12–16 kare, kare 512 × 512, şeffaf, **yazısız** | Aşağıdaki 7 olay için. |

Efekt animasyonları (C3):

| Dosya | Olay (oyundaki tetikleyici) | Konseptteki karşılığı |
|---|---|---|
| `fx-double` | Kendi çift zarın (`doRoll`) | "HOPP! ÇİFTE GELDİ!": parlayan iki zar |
| `fx-hit` | Rakip pulu kırma (`doHuman`/`autoPlay`) | "YAKALADIM SENİ!": pul fırlaması, kıvılcım |
| `fx-made` | İç alanda kapı alma | "DUVAR ÖRÜLDÜ!": yukarı ok, ışık |
| `fx-closed` | 6 iç kapı kapalı + rakip kırık | "ÇIKIŞ YOK!": alevli kapılar |
| `fx-mars-risk` | Mars riski (rakip hiç pul toplamamışken toplamaya başlama) | "MARS GELİYOR!": kırmızı iz |
| `fx-swing` | Üstünlükte büyük değişim | "OYUN DÖNDÜ!": dönen ok |
| `fx-win` | Galibiyet (mars, çekilme ve teklif varyantları kodla) | "TEBRİKLER!": kupa, patlama |

## 4. Sesler (isteğe bağlı; verilmeyenler mevcut sentez seslerle kalır)

| Dosya | Kullanım |
|---|---|
| `sfx-double`, `sfx-hit`, `sfx-made`, `sfx-closed`, `sfx-mars-risk`, `sfx-swing`, `sfx-win` | Efekt anları; "Efekt sesleri" ayarı ve seviye kaydırıcısıyla çalar |
| `sfx-bar-shift` | Üstünlük barı belirgin kaydığında kısa "whoosh" (≤0,4 sn) |
| `sfx-burn-loop` | Tam kapı efekti sürerken düşük seviyeli döngü (≤2 sn, kesintisiz döngü) |
| Tema başına `sfx-tap` (isteğe bağlı) | Düğme dokunuşu |

Zar ve pul sesleri şu an fiziksel sentezle üretiliyor ve tahtadaki çarpmalara göre zamanlanıyor; değiştirilmesi önerilmez.

## 5. Yazı tipleri

Konseptteki başlık ve slogan stili için tema başına bir görüntü yazı tipi gerekiyor. Şu an kullanılanlar: Exo 2 (Neon), Fredoka (Sunset), Playfair Display (Poker), Bungee (Arcade). Konseptle uyuşmayan varsa Google Fonts adıyla bildirilmeli; Türkçe karakter (ğ, ı, İ, ş) desteği şart.

## 6. Kararlar (proje sahibi onayladı) ve uygulama durumu

| # | Karar | Durum |
|---|---|---|
| 1 | Pullar dört temada beyaz ve kırmızı | Uygulandı (`theme/themes.js`, `tk.l` / `tk.d`) |
| 2 | Büyük "ZAR AT" düğmesi tahtanın ortasında; tahtaya dokunarak atma ve kaydırarak yön verme korunur | Uygulandı. Düğme yalnızca görünümdür, dokunuşlar tahtaya gider. `btn-roll.svg` gelince değişecek. |
| 3 | Konseptteki slogan metinleri | Uygulandı: DUVAR ÖRÜLDÜ!, TEBRİKLER!, ÇIKIŞ YOK!, MARS GELİYOR!, OYUN DÖNDÜ! |
| 4 | Mikrofon simgesi kalır, sesle yazma için | Uygulandı (Web Speech API; desteklemeyen tarayıcıda uyarı) |
| 5 | Şimdilik 6 çizgi avatar, isim girerken seçilir | Uygulandı (`assets/avatars.js`; online oda verisinde `av` alanı). ChatGPT avatarları (C1) gelince değişecek. |
| 6 | Büyük üstünlük değişimi eşiği tek turda ±15 puan | Uygulandı ("OYUN DÖNDÜ!") |

Geçici (varlıklar gelince değişecek) çizimler:
- üstünlük barı (T9)
- ZAR AT düğmesi (T11)
- tam kapı efekti (T10; şu an SVG gradyan ve elektrik çizgisi)
- avatarlar (C1)

Konum ve davranışlar kesinleşti; varlıklar aynı yerlere oturacak.

## 7. Kayıtlı zar ve pul sesleri (foley)

Altyapı hazır (`audio/foley.js`, `assets/sfx/manifest.json`):
- **Zar:** her çarpma, zar animasyonundaki gerçek çarpma anında çalar.
- **Pul:** her taş hamlesinde çalar; kırmada varsa ayrı `hit` örneği kullanılır.
- **Doğallık:** her çalışta başka bir örnek seçilir, ±%6 ton ve ±%15 seviye farkı uygulanır.
- **Üst üste binme:** aynı türden iki ses arasında en az 45 ms (zar) / 80 ms (pul) bırakılır.
- **Yedek:** liste boşken oyun mevcut sentez sesleriyle çalışır.

**Kaynaklar indirilemedi:** bu geliştirme ortamının ağ politikası `freesound.org` ve `pixabay.com` adreslerini engelliyor. Lisanslar da bu yüzden doğrulanamadı. Uydurma ses dosyası eklenmedi. Elle yapılması gerekenler:

| Kaynak | Kullanım | Yükle | Lisans kontrolü |
|---|---|---|---|
| freesound.org/people/andresix/sounds/347807 | zar | `assets/sfx/src/dice-andresix-347807.<uzantı>` | Sayfadaki lisans: CC0 ise sorun yok; CC BY ise uygulamada yazar adı gösterilmeli; **CC BY-NC ise ticari kullanım yok** |
| freesound.org/people/WiseOldHooter/sounds/725015 | zar | `assets/sfx/src/dice-wiseoldhooter-725015.<uzantı>` | aynı |
| pixabay.com/…/chess-pieces-hitting-wooden-board-99336 | pul | `assets/sfx/src/checker-pixabay-99336.mp3` | Pixabay İçerik Lisansı: ücretsiz, atıf gerekmez; sesin tek başına yeniden dağıtımı yasak, uygulama içinde kullanımı serbest |
| pixabay.com/…/board-game-taps-and-clatter-58212 | pul, kırma | `assets/sfx/src/checker-pixabay-58212.mp3` | aynı |

Freesound indirmek için oturum açmak gerekir. Dosyalar `assets/sfx/src/` klasörüne yüklenince (ya da sohbete eklenince) Claude Code şunları yapacak:
- `ffmpeg` ile 6–10 kısa zar çarpması, 6–8 pul sesi ve 3–4 kırma sesi kesecek
- sessizlikleri kırpıp seviyeleri eşitleyecek (M4A + OGG)
- `manifest.json`'u dolduracak
- atıf gerekiyorsa yardım ekranına yazar ve lisans bilgisini ekleyecek; `src/` klasörü yayına girmeyecek

## 8. Giriş ekranı (onaylı referans) — pakette olmayan görseller

Yerleşim ve tüm işlevler HTML/CSS olarak hazır; aşağıdaki görseller gelene kadar yedek görünüm kullanılıyor. Görseller **ayrı katmanlar** hâlinde gelmeli. Yazı, isim, düğme etiketi ve seçili durum görsele gömülmemeli.

Yeni görseller koda dokunmadan takılır: `theme/themes.js` içinde ilgili temaya `home:{logo:'…', table:'…', bg:'…'}` yazmak yeterli. Verilen yuva görselle değişir, verilmeyen yuvada yedek görünüm kalır.

| # | Dosya | Biçim, ölçü | Yuva | Not |
|---|---|---|---|---|
| H1 | `assets/common/logo.webp` (ya da tema başına `assets/<tema>/logo.webp`) | şeffaf, 1080 × 420 | `home.logo` | Taç ve zar detaylı "Tavla Masası" logosu. Görseldeki yazı yalnızca bu logo için kabul edilir; ekran okuyucu metni kodda kalır. Şu an yedek: CSS ile biçimlenmiş metin. |
| H2 | `assets/<tema>/home-bg.webp` | 1290 × 2796, şeffaf olmayan | `home.bg` | Tema sahnesi: neon şehir, gün batımı plajı, lounge, arcade salonu. Ortası sakin olmalı; paneller üstüne gelecek. |
| H3 | `assets/<tema>/home-table.webp` | şeffaf, 1170 × 560 | `home.table` | Üç boyutlu dekoratif tavla masası; çay bardağı gibi aksesuarlar dahil. Şu an yedek: paket SVG'leriyle perspektifli tahta. |
| H4 | `assets/common/icons.svg` | sembol seti, `viewBox 0 0 24 24` | — | Zil, ayarlar, bilgisayar, iki kişi, ok, seviye, set, saat, oynat, yenile, palet. Şu an basit yedek simgeler var. |

Notlar:
- Zil düğmesinin oyunda karşılığı yok; şu an "Şimdilik yeni bildirim yok" penceresi açıyor. Bildirim özelliği istenirse ayrıca konuşulmalı.
- Ses, slogan ve dil ayarları referansta görünmüyor; ⚙ ile açılan "Ayarlar" çekmecesine taşındı.
