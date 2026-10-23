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

## 6. Onay gereken kararlar (kodlamadan önce)

1. **Pul renkleri:** konseptte dört temada da beyaz ve kırmızı pul var. Şu an temalar farklı (neon pembe, sunset mor, poker siyah, arcade siyah). Konsepte mi dönülsün?
2. **"ZAR AT" düğmesi:** konseptte tahtanın altında büyük bir düğme var. Şu an zar, tahtanın ortasındaki düğmeyle ya da tahtaya dokunarak atılıyor. Düğme eklenip tahtaya dokunarak atma korunabilir.
3. **Slogan metinleri:** konseptte "DUVAR ÖRÜLDÜ!" (şu an "KAPI GİBİ!") ve "TEBRİKLER!" (şu an "İŞTE BU!") var. Ayrıca "ÇIKIŞ YOK!", "MARS GELİYOR!" ve "OYUN DÖNDÜ!" yeni. Konseptteki metinler mi kullanılsın?
4. **Mikrofon simgesi:** sesli mesaj özelliği yok. Simge kaldırılsın mı, yoksa ileride eklenecek bir özellik mi?
5. **Avatarlar:** oyuncu avatarını nereden seçecek (ana ekran)? Çevrim içi oyunda avatarın karşıya iletilmesi için oda verisine küçük bir `av` alanı eklenmesi gerekir. Bu oyun mantığını etkilemez.
6. **Üstünlük yüzdesi:** mevcut sinir ağı kazanma olasılığı (`wpRaw`) kullanılacak ve her tamamlanan taş hamlesinden sonra yeniden hesaplanacak (zar atıldığında değil). Tur ortasındaki ara hamlelerde değer yaklaşık olur. "Büyük değişim" eşiği için öneri: tek turda ±15 puan.
7. **Sahne arka planları (T1):** sohbet paneli açıkken tahtanın arkasında kalacak. Okunurluk için koyu bir örtü eklenmesi gerekebilir.
