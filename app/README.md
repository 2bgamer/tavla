# Tavla Sultanı · iOS uygulaması (Capacitor)

Web oyunu (depo kökü) `www/` klasörüne kopyalanır ve Capacitor ile yerel iOS uygulamasına paketlenir.
Oyun dosyaları uygulamanın içindedir; bilgisayara karşı oyun internetsiz de açılır.

## Bir kez yapılacaklar

1. **Apple Developer Program** üyeliği (yıllık 99 $).
2. **Paket kimliği:** `capacitor.config.json` içindeki `appId` (`com.games2b.tavlasultani`). Değiştirmek istersen ilk yüklemeden önce değiştir; App Store Connect'te aynı kimlikle uygulama kaydı aç.
3. **Firebase konsolu > Proje ayarları > Uygulama ekle > iOS:** paket kimliğini yaz, `GoogleService-Info.plist` dosyasını indir ve Xcode'da `App/App` klasörüne sürükle ("Copy items if needed" işaretli).
4. `ios/App/App/Info.plist` içindeki `com.googleusercontent.apps.DEGISTIR` URL şemasını `GoogleService-Info.plist` içindeki `REVERSED_CLIENT_ID` değeriyle değiştir (Google girişi uygulamaya buradan döner).
5. **Apple ile Giriş:** Xcode > App hedefi > Signing & Capabilities > **+ Sign in with Apple**. Firebase konsolu > Authentication > Sign-in method > **Apple**'ı aç.
6. **Uygulama simgesi:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` şu an 512 px simgenin büyütülmüş hâli. Mağaza için 1024×1024, saydamlığı olmayan özgün bir simgeyle değiştir.
7. **API anahtarı:** Google Cloud konsolunda anahtara HTTP yönlendiren kısıtı koyarsan iOS uygulaması `capacitor://localhost` adresinden istek atar; kısıtı ya ekle ya da anahtarı "iOS uygulamaları" kısıtıyla ayrıca tanımla.

## Derleme (Mac + Xcode 16 ya da üstü)

```sh
cd app
npm install
npm run sync      # depo kökünden www/ oluşturur, iOS projesine kopyalar
npm run open      # Xcode'u açar
```

Xcode'da Signing > Team'i seç, gerçek bir iPhone'da dene, sonra **Product > Archive** ile TestFlight'a / App Store Connect'e yükle.
Oyunda her değişiklikten sonra `npm run sync` yeniden çalıştırılır.

## Uygulamada web'den farklı olanlar

| Konu | Web | iOS uygulaması |
| --- | --- | --- |
| Google girişi | Firebase penceresi | Yerel Google penceresi (`@capacitor-firebase/authentication`), sonuç web SDK'sına aktarılır |
| Apple ile Giriş | `APPLE_ON` açılınca | Her zaman, Google'ın üstünde |
| E-posta bağlantısıyla giriş | Var | Yok (bağlantı uygulamaya dönemiyor) |
| Sesle yazma (mikrofon) | Var | Gizli (izin metni gerekmez) |
| Titreşim | Yok | Pul ve zar hareketinde (`@capacitor/haptics`) |
| Gizlilik / şartlar | Yeni sekme | Aynı görünümde, belgede oyuna dönüş bağlantısı |

Ayarlar: yalnız iPhone, yalnız dikey, `ITSAppUsesNonExemptEncryption = NO` (yalnız HTTPS).
