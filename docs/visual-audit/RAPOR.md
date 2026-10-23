# Tavla Masası: görsel denetim raporu

- **İncelenen sürüm:** `main` 633292a (PR #6 dahil), uygulama sürümü `202610251600`.
- **Tarih:** 2026-10-23.
- **Yöntem:**
  - Ekran görüntüleri gerçek oyundan alındı: 390 × 844, 2x piksel yoğunluğu, Chromium mobil öykünmesi, gerçek Google Fonts yazı tipleri.
  - Otomatik testler çalıştırıldı.
  - Kod incelendi.
- Bu aşamada kod ya da grafik değiştirilmedi.

## 1. Özet

Oyunun işlevleri tam ve kararlı. Tüm otomatik testler geçiyor (196/196), dört temada da sayfa hatası yok.

Gerekenler iki kümede toplanıyor:
- **Grafik kalitesi:** logo, sinematik arka planlar, dekoratif masa, efekt ve galibiyet animasyonları hiç yok. Tahta, pul ve düğmeler v2 SVG'leriyle "temiz ama düz" görünüyor.
- **Küçük yerleşim sorunları:** en önemlisi, ZAR AT düğmesi bardaki kırık pulu kapatıyor.

## 2. Ekran görüntüleri

Klasör: `docs/visual-audit/<tema>/`. Her temada 6 durum var:

| Dosya | Durum |
|---|---|
| `1-giris.jpg` | Giriş ekranı |
| `2-baslangic.jpg` | Başlangıç dizilimi, sıra oyuncuda, ZAR AT görünür |
| `3-hamle.jpg` | Normal oyun: 6-3 atıldı, bir pul oynandı, ikinci pul seçili, rakibin son hamlesi işaretli |
| `5-toplama.jpg` | Pul toplama: kanal hedef, süre halkasında son 5 sn (kırmızı) |
| `4-kapi-kirik.jpg` | Altı iç kapı kapalı, rakip pul barda |
| `6-bitis.jpg` | Galibiyet: TEBRİKLER! ve "Maçı kazandın" penceresi |

Tema başına özet görseller: `ozet-neon.jpg`, `ozet-sunset.jpg`, `ozet-poker.jpg`, `ozet-arcade.jpg`.

Görüntüler `tests/visual-audit.js` ile yeniden üretilebilir. Aynı durumlar her grafik entegrasyonundan sonra tekrar çekilecek.

Giriş ekranı kontrolleri dört temada da geçti:
- logo tek satırda ve ekran içinde
- oyuncu adı görünüyor
- dekoratif masa doğru yerde
- seçili ayarlar doğru (Usta / 3 set / 20 sn)
- yatay taşma yok

## 3. Eksikler (önem sırasına göre)

### Yüksek

1. **ZAR AT düğmesi bardaki kırık rakip pulu kapatıyor.**
   - Görüldüğü yer: `4-kapi-kirik.jpg`, dört temada da.
   - Düğme orta barın tam üstünde duruyor; bardaki kırmızı pulun yalnızca alt kenarı görünüyor.
   - Oyuncu rakibin kırık olduğunu tahtada göremiyor.
   - Çözüm seçenekleri:
     - kırık pul varken düğmeyi küçültmek ya da yukarı almak
     - bardaki pulu düğmenin üst ya da altına yerleştirmek
     - yeni `btn-roll` görselini alçak tasarlamak (grafik listesi 2.6)
2. **Logo görseli yok.** Giriş başlığı CSS ile biçimlenmiş yazı.
3. **Sinematik arka plan yok.** Giriş ve oyun ekranında düz renk ve degrade var. App Store kalitesinden en uzak öğe bu.
4. **Dekoratif 3B masa yok.** Girişteki masa, oyunun kendi SVG'lerinden üretilmiş perspektifli bir yedek.
5. **Gerçek Firebase ile iki cihaz testi yapılmadı.** Online oyun yalnızca yerel taklit sunucuyla test edildi (bkz. 5.3).

### Orta

6. **Efekt animasyonları yok.** Kırma, kapı alma, çift zar, oyun döndü ve mars riski anlarında yalnızca slogan yazısı ve kısa ses var; görsel patlama ya da kıvılcım yok.
7. **Galibiyet ve mars animasyonu yok.** Yazı bandı ve sonuç penceresi var; kupa, konfeti ya da patlama yok.
8. **Kapalı kapı efekti soluk.** `fx-closed-point.svg` yalnızca hafif bir parıltı. "Kapı alevleri" konseptindeki etki yok, özellikle Sunset ve Poker temalarında zor seçiliyor.
9. **Zarlar küçük ve sade.** Zar kenarı yaklaşık 24 piksel; yüzler kodla çiziliyor, tema dokusu yok.
10. **Uzun ekranlarda alt boşluk.** 390 × 844'te (Safari çubukları gizliyken) alt panelin altında yaklaşık 150 px boş alan kalıyor. Bunun nedeni, tahtanın genişliğe göre en büyük boyutta olması ve alt panelin sabit 156 px tutulması. Boşluğa üç seçenek var:
    - oyun arka planıyla (2.2) doldurmak
    - içeriği dikeyde ortalamak
    - geçmiş/sohbet satır sayısını uzun ekranda artırmak
11. **Avatarlar geçici.** 6 çizgi avatar ve BuBi robotu kodla çizilmiş.
12. **Kayıtlı zar ve pul sesleri yok.** `assets/sfx/manifest.json` boş; zar ve pul sesleri sentezleniyor. Özel kayıtlar (binf, oh, 2.+ kırık) var.

### Düşük

13. Skor kutusundaki "SIRA SENDE / SIRA RAKİPTE" yazısı 10 px; küçük ekranlarda zor okunabilir.
14. Toplama kanalındaki toplanmış pullar düz renkli çubuklar; pul dokusu yok.
15. Arayüz simgeleri emoji ve basit çizimler (🏳️, 🔇, ✎); temalar arasında üslup farkı yok.
16. Giriş ekranındaki zil düğmesinin işlevi yok ("Şimdilik yeni bildirim yok").

## 4. Alan alan durum

| Alan | Durum | Not |
|---|---|---|
| Dört tema | Çalışıyor | Tema değişimi maç durumunu değiştirmiyor (test edildi). Renkler ve v2 SVG'leri doğru yükleniyor. |
| Giriş ekranı | Çalışıyor | Kaydırarak ya da ‹ › oklarıyla tema seçimi; ad, avatar, mod, seviye/set/süre; devam düğmesi. Görsel eksikler: 2, 3, 4. |
| Mobil masa boyutu | İyi | Tahta ekran genişliğini dolduruyor (390 px'te yanlarda 4 px). 390 × 664'te (Safari çubukları açık) kaydırma gerekmiyor. |
| Pul hareketi, toplama kanalı | Çalışıyor | Sol kanal korunuyor; dokunarak/tıklayarak toplama test edildi. Başlangıç dizilimi 2/5/3/5, her tarafta 15 pul. |
| Canlı üstünlük barı | Çalışıyor | Zar atılınca değişmiyor; her tamamlanan taş hamlesinden sonra güncelleniyor (test edildi). |
| Avatar zamanlayıcısı | Çalışıyor | Yeşil halka; son 5 sn kırmızı ve sayı gösteriyor. Arka planda gerçek süreye göre azalıyor; her turda sıfırlanıyor; yeniden bağlanmada doğru oyuncuda. |
| Online oyun ve sohbet | Taklitle çalışıyor | Oda kurma, davet bağlantısı (`?oda=`), iki tarayıcıda hamle eşleşmesi, sohbet, yeniden bağlanma test edildi. Gerçek Firebase denenmedi. |
| Ses ve özel efektler | Kısmen | Sesler sentez ve özel kayıtlardan geliyor; iOS askıya alma düzeltmesi var. Görsel efekt animasyonu yok. |

## 5. Testler

### 5.1 Otomatik test sonuçları

| Profil | Sonuç |
|---|---|
| Chromium 390 × 844 (yerel) | **196/196 geçti** |
| Chromium · iPhone SE (yerel) | **196/196 geçti** |
| WebKit (Safari motoru) · iPhone 13 | Yerelde kurulu değil; GitHub CI'da çalışır. Son `main` sürümünde (PR #6) üç profil de geçti. |

Kapsam (`tests/e2e-themes.js`):
- dört tema
- giriş ekranı: tema, devam, seçenekler, taşma
- başlangıç dizilimi
- toplama kanalı
- süre halkası
- üstünlük barı
- sloganlar
- sesler ve askıya alınan ses bağlamı
- online oda, sohbet, yeniden bağlanma
- davet bağlantısı
- tek ekrana sığma
- iPhone SE

### 5.2 Gerçek iPhone'da elle doğrulanması gerekenler

Otomatik testler gerçek bir iPhone'un davranışını tam taklit edemez. Aşağıdakiler gerçek cihazda, Safari'de ve "Ana Ekrana Ekle" ile açılan uygulamada denenmeli.

**Ekran ve dokunma**
- [ ] Tahta ekran genişliğini dolduruyor; üst bölüm, tahta ve alt panel kaydırmadan görünüyor (Safari çubukları açıkken ve kapalıyken)
- [ ] Çentik ve ana ekran çubuğu hiçbir düğmeyi kapatmıyor
- [ ] Pula dokunup hedefe dokunma ve sürükleme kolay; yanlış noktaya gitmiyor
- [ ] Tahtaya dokunarak ve kaydırarak zar atma çalışıyor
- [ ] Sol kanala pul toplama dokunuşla çalışıyor
- [ ] Yatay çevirmede bozulma yok

**Süre ve arka plan**
- [ ] Süre halkası yeşil başlıyor, son 5 sn kırmızı
- [ ] Uygulamayı arka plana alıp 10 sn sonra dönünce süre doğru

**Ses**
- [ ] Sessiz mod anahtarı açıkken ve kapalıyken sesler
- [ ] Arka plandan dönüşte, bildirim geldikten sonra ve telefon görüşmesinden sonra sesler hâlâ çalıyor
- [ ] 2. kırıkta yeni kayıt eski sesle birlikte çalıyor

**Sohbet ve klavye**
- [ ] Klavye açılınca yazı kutusu görünür, sayfa büyümüyor
- [ ] Sesle yazma (mikrofon) izni ve çalışması

**Güncelleme**
- [ ] Yeni sürüm yayınlandıktan sonra uygulamayı kapatıp açınca güncelleme geliyor

**Online (iki gerçek cihaz)**
- [ ] Oda kurma
- [ ] Davet bağlantısını WhatsApp'tan gönderme ve açma
- [ ] Hamle eşleşmesi
- [ ] Sohbet
- [ ] Bir cihazın ağını kapatıp açınca yeniden bağlanma
- [ ] Uygulamayı kapatıp açınca aynı odaya dönme

### 5.3 Gerçek Firebase ile iki oyuncu: otomatik testten farkı

Otomatik online testler gerçek Firebase'e bağlanmıyor. Yerel taklit sunucu `tests/rtdb-mock.js` kullanılıyor; bu geliştirme ortamının ağı Firebase'e erişime izin vermiyor. Taklit; REST okuma/yazma ve canlı akış (SSE) davranışını aynı biçimde uyguluyor, ama şunları **doğrulamıyor**:

- **Ağ gecikmesi ve kopma.** Testte iki oyuncu aynı bilgisayarda, gecikme yok. Gerçekte mobil ağda gecikme, paket kaybı ve akışın kopması var.
- **Firebase güvenlik kuralları.** Taklit her yazmaya izin veriyor. Gerçek kurallar oda yolunu ya da alanları (`av`, `nm`) kısıtlıyorsa yazma reddedilebilir.
- **Eşzamanlı yazma çakışması.** İki cihazın aynı anda yazması gerçek sunucuda farklı sırayla sonuçlanabilir.
- **iOS arka plan davranışı.** Safari arka plandaki sayfanın bağlantısını keser. Taklitte bu senaryo, sayfayı yeniden yükleyerek yaklaşık olarak test ediliyor.
- **Kota ve hız sınırları.** Firebase ücretsiz planının eşzamanlı bağlantı ve indirme sınırları.
- **Farklı sürümlerin aynı odada buluşması.** Bir oyuncu eski önbellekli sürümdeyse alan uyumsuzluğu çıkabilir.

Bu yüzden online özellikler, iki gerçek telefonla yukarıdaki listeye göre elle denenmelidir.

## 6. Önerilen entegrasyon sırası

Her adım ayrı bir PR olarak gelsin; her PR'da ekran görüntüleri ve testler olsun. Sıra, etki ve risk dengesine göre:

1. **ZAR AT / bar çakışması** (kod düzeltmesi, grafik beklemez)
2. **Logo** (2.1): en görünür, en düşük risk; tek yuva (`home.logo`), kod hazır
3. **Giriş arka planları ve dekoratif masa** (2.2, 2.3): yuvalar hazır (`home.bg`, `home.table`); dört tema birlikte
4. **Oyun ekranı arka planı** (2.2 `game-bg`): uzun ekrandaki boşluğu da çözer
5. **Tahta dokuları, çerçeve, pullar** (2.4, 2.5): aynı adla değişim; kanal ve bar okunurluğu kontrol edilir
6. **ZAR AT düğmesi ve zar yüzleri** (2.6): düğme yüksekliği 1. adımla uyumlu olmalı
7. **Avatar seti ve çerçeveler** (2.7): `avatars.js` sırası korunur; online odadaki `av` numarası değişmez
8. **Üstünlük barı** (2.8)
9. **Kapı alevi ve olay efektleri** (2.9): sprite oynatıcısı eklenir (küçük bir kod işi); `moment()` olaylarına bağlanır
10. **Galibiyet, mars, konfeti** (2.10)
11. **Simge seti** (3) ve isteğe bağlı sesler

Her adımda:
- dört tema 390 × 844'te yeniden fotoğraflanır
- tema başına boyut kontrol edilir
- `sw.js` önbellek listesi güncellenir
- CI'ın üç profili yeşil olunca canlıya alınır
