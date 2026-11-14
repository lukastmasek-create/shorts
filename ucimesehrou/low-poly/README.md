# Učíme se hrou: 3D low-poly (three.js)

12,8 s animace ve stylu **Low-Poly**: miniaturní ostrov z plochých facet, jako ze skládaného papíru. Žák jde po ostrově a kamera jede s ním jedním jeřábovým záběrem: **předměty** (kostky vyskočí ze země), **hry** (Farma, Město, Mazlíčci), **AI doučovač** (zlomky vysvětlené pizzou), **týmy** (zadání od učitele a čtyři odškrtnutí). Pak se přes obraz rozloží papír a zbyde koncová obrazovka mimo ostrov: *„Objev svět, kde učení baví“*, čtyři SVG ikony (ZŠ, SŠ, přijímačky, maturita) a adresa `ucimesehrou.org`.

Jen three.js 0.187.0 z CDN, žádné modely ani textury: všechno je v kódu (ikony jsou SVG z facetových trojúhelníků, kreslené v `style.js`). Česky, bez mluveného slova, zvuk je syntetizovaný (Web Audio).

## Soubory
| Soubor | Co to je |
|---|---|
| `index.html` | Hotový přehrávač v jednom souboru (play, posuvník, čas, zvuk, smyčka). Otevři v prohlížeči. |
| `storyboard.html` | Storyboard: pět klíčových snímků vykreslených v prohlížeči, pod každým text, pohyb, kamera a zvuk. |
| `src/style.js` | Celý příběh: obsah a rozvrh `T` nahoře, pak svět, postavy, ikony, koncová obrazovka, kamera a zvuková partitura. |
| `src/player.tpl.html`, `src/storyboard.tpl.html` | Šablony přehrávače a storyboardu. |
| `../src/stage.js`, `../src/sound.js` | Renderovací a zvukový kit, sdílené s pop-up animací (beze změn). |
| `build.cjs` | Slepí šablony, kity a styl do `index.html` a `storyboard.html`. |
| `render.cjs` | Vyrenderuje MP4 (1920×1080, 30 fps, zvuk kolem -15 LUFS). |
| `video/ucimesehrou-3d.mp4` | Hotové video (12 vzorků na snímek, viz níže). |

## Render MP4
Stejně jako u pop-up animace: Node a Google Chrome, balíčky z `ucimesehrou/package.json`.
```bash
cd ucimesehrou && npm i && cd low-poly
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node render.cjs 32
```
Číslo je počet vzorků na snímek (motion blur, hloubka ostrosti, měkké stíny): 32 je dobré, 64 je plná kvalita. Výsledek: `video/ucimesehrou-3d.mp4`. Přerušený render naváže, kde skončil.

Přiložené MP4 vzniklo v cloudu bez GPU s 12 vzorky (zhruba hodina), takže má o něco hrubší rozmazání pohybu a hloubku ostrosti než plná kvalita. Na stroji s GPU ho přerenderuj s 64.

## Úpravy
- Rozvrh (kdy co naskočí, kdy se rozloží papír) je objekt `T` na začátku `src/style.js`. Obraz i zvuk čtou z něj, takže drží pohromadě.
- Texty, předměty, hry a štítky jsou v bloku obsahu úplně nahoře (`STEPS`, `SUBJECTS`, `GAMES`, `TILES`, `TITLE`, `SIGN`).
- Ikony koncové obrazovky jsou funkce v `ICON_SVG`. Každý tvar se rozřeže na trojúhelníky a každý dostane vlastní odstín.
- Po změně spusť `node build.cjs`.

## Fakta na obrazovce
Hry Farma, Město a Mazlíčci i úrovně Základní škola, Střední škola, Přijímačky a Maturita jsou z kódu webu. Příklad se zlomky a pizzou a čtyři odškrtnutí v týmech jsou ilustrace, ne převzaté z webu. Z předmětů je ukázáno šest ze patnácti (Čeština, Matematika, Angličtina, Chemie, Dějepis, Hudebka).
