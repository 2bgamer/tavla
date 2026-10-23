# Uçtan uca testler (masa temaları ve olay sloganları)

```sh
python3 -m http.server 8765 &          # depo kökünde
node tests/rtdb-mock.js 8790 &         # Firebase RTDB taklidi (online oyun + sohbet)
node tests/e2e-themes.js               # Playwright gerekir (npm i -D playwright)
```

Ekran görüntüleri `tests/out/` klasörüne yazılır.
