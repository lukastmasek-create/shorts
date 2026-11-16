# PredictShort (#91 "AI Predicts Your Death") — fact check
Checked by web search 2026-11-16; some pages secondary. Bars/dials on screen are schematic. No accuracy percentages on screen.

| Claim | Source | Note |
|---|---|---|
| Stanford team trained a deep neural network on hospital EHR data to estimate probability of death within 3–12 months, to flag patients for palliative care | Avati et al., "Improving palliative care with deep learning", BMC Med Inform Decis Mak 18(Suppl 4):122, 2018 (https://bmcmedinformdecismak.biomedcentral.com/track/pdf/10.1186/s12911-018-0677-8); arXiv:1711.06402 | purpose = alert palliative team; "nine in ten" is press-only, not used |
| Model output hard to explain (what/when, not why) | CNBC / Gizmodo coverage 2018 (https://www.cnbc.com/2018/01/24/ai-used-to-predict-when-people-may-die-for-better-medical-care.html) | secondary; authors aimed for interpretability — say "hard to explain", not "cannot" |
| 2020: Geisinger/Tempus deep net on 12-lead ECGs predicted one-year mortality; worked on ECGs physicians read as normal | Raghunath et al., Nature Medicine 26:886–891, 2020 (preprint https://arxiv.org/pdf/1904.07032) | AUC 0.88 overall, ~0.85 normal subset (published); numbers differ between preprint/paper → not shown |
| Cardiologists in a masked survey could not detect the pattern the model used | same paper (via Healio 2019 summary) | secondary summary |
| 2023: life2vec trained on Danish national registers (labour + health), ~6 million people, predicts early mortality (4-year window) better than baselines | Savcisens et al., "Using sequences of life-events to predict human lives", Nature Comput Sci 4:43–56, 2024 (online Dec 2023) | improvement figure disputed (11% vs 17%) → not shown |
| Limits: Danish data only, sociodemographic bias, accidents unforeseeable | same paper / ScienceAlert, KU SODAS summary (https://sodas.ku.dk/research/processing-a-life-like-a-language-helps-predict-future-personal-events/) | authors' own caveats |

## Do not claim
- Any accuracy %, AUC or "beats baseline by X%" (versions/sources disagree).
- That any of these tools gives individuals an exact date, or are public products.
- "90% accurate" for Stanford (press-only).
- That life2vec was released/not released to the public (unverified).
- That "AI refuses to explain": say hard to interpret.
