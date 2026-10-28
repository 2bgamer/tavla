# Uçtan uca testler (masa temaları ve olay sloganları)

```sh
python3 -m http.server 8765 &          # depo kökünde
node tests/rtdb-mock.js 8790 &         # Firebase RTDB taklidi (online oyun + sohbet)
node tests/e2e-themes.js               # Playwright gerekir (npm i -D playwright)
```

Ekran görüntüleri `tests/out/` klasörüne yazılır.

## Veritabanı kuralları (database.rules.json)

Firebase emülatörü Java ister. Araçlar: `npm i --no-save firebase-tools@14 @firebase/rules-unit-testing@4 firebase@11`

```sh
npx firebase emulators:exec --only database --project demo-tavla "node tests/rules-test.js"   # kural testleri
# oyun testlerinin tamamı gerçek kurallarla (rtdb-mock yerine emülatör):
DB=http://localhost:9000 DBNS=demo-tavla-default-rtdb npx firebase emulators:exec --only database --project demo-tavla "node tests/e2e-themes.js"
```

Kurallar canlıya Firebase konsolundan (Realtime Database > Rules) bu dosyanın içeriği yapıştırılarak yayımlanır.
