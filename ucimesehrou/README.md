# Učíme se hrou: pop-up kniha (three.js)

15,7 s animace ve stylu **Paper Pop-Up**: kniha na dřevěném stole, ze které se při otočení listu zvedají papírové scény. Říká, jak web Učíme se hrou pomáhá žákům se učit, a končí 2,5 s mottem „Objevuj svět, kde učení baví.“ se čtyřmi SVG ikonami (ZŠ, SŠ, přijímačky, maturita).

Žádná knihovna kromě three.js 0.187.0 z CDN, žádné modely ani textury: všechno je v kódu. Česky, bez mluveného slova, zvuk je syntetizovaný (Web Audio).

## Soubory
| Soubor | Co to je |
|---|---|
| `index.html` | Hotový přehrávač v jednom souboru (play, posuvník, zvuk, smyčka). Otevři v prohlížeči. |
| `src/style.js` | Celý příběh: obsah spreadů nahoře, pak kniha, světlo, kamera a zvuková partitura. |
| `src/stage.js`, `src/sound.js` | Renderovací a zvukový kit (beze změn). |
| `src/player.tpl.html` | Šablona přehrávače. |
| `build.cjs` | Slepí `src/` do `index.html`. |
| `render.cjs` | Vyrenderuje MP4 (1920×1080, 30 fps, zvuk kolem -15 LUFS). |
| `INSTAGRAM.md` | Popisek na Instagram. |
| `PROMPT_TEMPLATE.md` | Šablona zadání pro další animaci v tomto stylu. |

## Render MP4
Potřebuješ Node a Google Chrome.
```bash
cd ucimesehrou
npm i
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node render.cjs 32
```
Číslo je počet vzorků na snímek (motion blur, hloubka ostrosti, měkké stíny): 32 je dobré, 56 je plná kvalita. Výsledek: `video/ucime-se-hrou.mp4`. Přerušený render naváže, kde skončil. ffmpeg se bere z `ffmpeg-static`, Homebrew netřeba.

## Úpravy
- Texty, kresba a předměty jsou v bloku `SPREADS` v `src/style.js`.
- Délka: `TURN` (otočení listu, 1,25 s) a `HOLD` (jak dlouho spread stojí, 2 s). Celková délka se dopočítá, `render.cjs` ji čte sám.
- Po změně spusť `node build.cjs`.

## Fakta na obrazovce
Z textu webu: žáci 1.–9. třídy, přijímačky, maturita, pět úrovní u každého kurzu, denní kvíz, opakování, únikovky, rodič vidí pokrok, učitel zadává úkoly. Příklad 7 × 8 = 56 s vysvětlením je ukázkový úkol.

## Druhá verze: 3D low-poly
Ve složce `low-poly/` je druhá animace Učíme se hrou, tentokrát ve stylu Low-Poly (miniaturní ostrov z facet, jeden jeřábový záběr, koncová obrazovka se čtyřmi SVG ikonami). Sdílí `stage.js` a `sound.js` odsud. Viz `low-poly/README.md`.
