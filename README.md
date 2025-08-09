# RPL Picker + PDF (client-side)

Strona statyczna do wybierania produktów leczniczych z Rejestru Produktów Leczniczych (RPL) i generowania PDF — **bez serwera**, dane użytkownika nie opuszczają przeglądarki.

## Hosting
- Działa na **GitHub Pages** (branch `main`, folder `/`).
- Można też osadzić na **Google Sites** jako iframe.


## Skąd dane?
- Codziennie o 06:00 UTC workflow pobiera CSV z RPL:
  - **CSV (pełny raport):**
    `https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/public-pl-report/get-csv`

  Alternatywnie dostępny jest też zestaw w portalu Otwarte Dane (dane.gov.pl), ale w repo domyślnie używamy bezpośredniego CSV CeZ.

## Jak włączyć GitHub Pages
1. Wgraj cały katalog do nowego repo na GitHubie (np. `rpl-picker`).  
2. Wejdź w **Settings → Pages** i ustaw:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` i folder `/ (root)`
3. Po chwili strona będzie pod adresem `https://<twoje_konto>.github.io/rpl-picker/`

## Jak to działa (front)
- Użytkownik może **wczytać lokalny plik CSV/XLSX** (pełna prywatność) **lub** kliknąć „Wczytaj CSV z repozytorium” — wtedy strona pobierze `data/rpl.csv` z tego repo (zaktualizowany przez workflow).
- Wyszukiwanie po nazwie + wybór mocy/opakowania na podstawie realnych kombinacji z CSV.
- Lista wybranych + **presety** zapisywane lokalnie (`localStorage`).
- **PDF** generowany w przeglądarce (jsPDF).

## Pliki
- `index.html` — strona główna (React z CDN, bez budowania).
- `app.js` — logika (parsowanie CSV `Papa.parse`, PDF `jsPDF`).
- `data/rpl.csv` — aktualny CSV (automatycznie aktualizowany; może być nieobecny zaraz po klonie, pojawi się po pierwszym workflow).
- `.github/workflows/fetch-rpl.yml` — pobieranie CSV codziennie.
- `.nojekyll` — dla GitHub Pages.
- `LICENSE` — MIT.

## Lokalne uruchomienie
Po prostu otwórz `index.html` w przeglądarce. Część przeglądarek wymaga uruchomienia z serwera plików (np. `python3 -m http.server 8080`), aby `fetch('data/rpl.csv')` działał lokalnie.

---

### Uwaga dot. prywatności
Wersja „online” korzysta tylko z pliku `data/rpl.csv` w tym repo (publicznym). Wersja „upload” działa w 100% lokalnie w przeglądarce.
