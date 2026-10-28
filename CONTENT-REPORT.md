# RAXUSATPrep — Content report

Built 2026-10-28. Pattern last checked 2026-10-28 (from the build brief — confirm on official HEC/ETC sources).

## 1. Source inventory

| Source (PDFs from this project) | Used for | Questions in bank | Verified | Needs review |
|---|---|---:|---:|---:|
| TIPS Biology for HEC USAT + checked "USAT-M Biology All MCQs with Answers" PDF | Biology | 2,141 | 2,114 | 27 |
| TIPS Chemistry for HEC USAT (scan, options) + checked "USAT Chemistry Questions and Answers" PDF | Chemistry | 600 | 411 | 189 |
| TIPS Physics for HEC USAT (scan, options) + checked Physics answers | Physics | 1,007 | 713 | 294 |
| TIPS Quantitative Reasoning for HEC USAT (scan, options) + checked QR answers | Quantitative Reasoning | 517 | 333 | 184 |
| TIPS Verbal Reasoning for HEC USAT (scan, options, passages, word list) + checked VR answers | Verbal Reasoning | 1,365 | 1,356 | 9 |
| TIPS English Argumentative & Narrative Essay for HEC USAT + essay kit PDF | Essay module | 54 topic kits, 15 narrative prompts, 5 model essays, templates and phrase banks | — | — |
| **Total** | | **5,630** | **4,927** | **703** |

No questions were invented. The original PDFs are not included in the site.

## 2. How questions were extracted and classified

- **Biology:** text extraction from the checked Biology PDF (options, answers, corrections and notes as printed).
- **Chemistry, Physics, QR, VR:** options from OCR of the scanned TIPS books; answers from the checked answer PDFs built earlier in this project. Each checked answer was matched to an option by text; questions are only verified when the match is clear.
- **Topics:** Biology, Chemistry and Physics use the book chapters. QR sections map to Arithmetic, Algebra and Functions, Statistics, Equations, Geometry and Scenario-based / Mental Maths (the 8 sample questions were classified one by one). VR: analogies → Analogy; sentence completion and the preposition exercises → Sentence Completion; passages → Comprehension (stored once with `passageId`, 41 passages).
- **Synonyms / Antonyms:** 936 MCQs built from the book’s word list of 469 words. The correct answer comes from the book; wrong options are other words from the list plus the word’s own opposite (`optionsSource: "generated"`).
- **Difficulty** is an estimate from question length, negatives (“not”, “except”) and whether a calculation is needed.
- **Explanations** were written for this project (`explanationSource: "generated"`, shown as “RAXUSATPrep explanation”). Answers worked out where the book gives none are `answerSource: "solved"`.

## 3. Status rules

- The answer for every question comes from the checked RAXUSATPrep study documents (Biology, Chemistry, Physics, Quantitative Reasoning and Verbal Reasoning Questions and Answers). Each record keeps that checked answer in `answerText` when it is worded differently from the option.
- `verified` — the options read cleanly and the checked answer clearly matches one option. Where the book’s key was wrong, the corrected answer from the checked documents is used (`answerSource: "solved"`, tag `corrected-key`, the book’s old key named in the explanation). Answers the book did not give are `answerSource: "solved"`.
- `needs-review` — no correct option printed, options garbled by the scan (mostly maths notation: fractions, powers, roots, Greek letters), or the scan’s question text differs from the checked edition. Each has a `reviewNote` with the reason and the checked answer.
- Only verified questions are used in mocks and the daily challenge. Needs-review questions appear in practice by default, labelled “Unverified” with the checked answer (they can be hidden in Settings). Every question appears in the in-app Question bank as question → checked answer → explanation, like the study PDFs.

## 4. Counts by subject and topic

### Biology (2,114 verified of 2,141)

| Topic / chapter | Verified | Total |
|---|---:|---:|
| Introduction | 20 | 20 |
| Biological Molecules | 20 | 20 |
| Enzymes | 19 | 19 |
| The Cell | 20 | 20 |
| Variety of Life | 20 | 20 |
| Kingdom Prokaryotae (Monera) | 20 | 20 |
| The Kingdom Protista (or Protoctista) | 20 | 20 |
| Fungi: The Kingdom of Recyclers | 19 | 20 |
| Kingdom Plantae | 20 | 20 |
| Kingdom Animalia | 20 | 20 |
| Bioenergetics | 19 | 19 |
| Nutrition | 20 | 20 |
| Gaseous Exchange | 20 | 20 |
| Transport | 19 | 20 |
| Homeostasis | 109 | 109 |
| Support and Movements | 158 | 158 |
| Coordination and Control | 214 | 217 |
| Reproduction | 220 | 222 |
| Growth and Development | 112 | 114 |
| Chromosomes and DNA | 152 | 153 |
| Cell Cycle | 106 | 110 |
| Variation and Genetics | 245 | 249 |
| Biotechnology | 185 | 188 |
| Evolution | 116 | 119 |
| Ecosystem | 100 | 101 |
| Some Major Ecosystems | 57 | 57 |
| Man and his Environment | 64 | 66 |

### Chemistry (411 verified of 600)

| Topic / chapter | Verified | Total |
|---|---:|---:|
| Fundamental Concepts in Chemistry | 22 | 33 |
| Gases | 12 | 19 |
| Liquids and Solids | 27 | 33 |
| Atomic Structure | 26 | 39 |
| Chemical Bonding | 20 | 32 |
| Energetics of Chemical Reactions | 8 | 16 |
| Chemical Equilibrium | 1 | 4 |
| Solutions and Electrolytes | 13 | 28 |
| Chemical Kinetics | 2 | 6 |
| Periodic Classification of Elements and Periodicity | 15 | 20 |
| S-Block Elements | 15 | 20 |
| Group IIIA and Group IVA Elements | 14 | 20 |
| Group VA and Group VIA Elements | 15 | 19 |
| The Halogens and the Noble Gases | 20 | 25 |
| Transition Elements | 7 | 15 |
| Fundamental Principles of Organic Chemistry | 8 | 17 |
| Aliphatic Hydrocarbons | 12 | 15 |
| Aromatic Hydrocarbons | 21 | 37 |
| Alkyl Halides | 14 | 23 |
| Alcohols, Phenols and Ethers | 25 | 30 |
| Aldehydes and Ketones | 25 | 31 |
| Carboxylic Acids | 18 | 21 |
| Macromolecules | 24 | 35 |
| Common Chemical Industries in Pakistan | 28 | 32 |
| Environmental Chemistry | 19 | 30 |

### Physics (713 verified of 1,007)

| Topic / chapter | Verified | Total |
|---|---:|---:|
| Measurements | 36 | 39 |
| Vectors and Equilibrium | 21 | 39 |
| Motion and Force | 31 | 50 |
| Work and Energy | 26 | 39 |
| Circular Motion | 20 | 38 |
| Fluid Dynamics | 30 | 37 |
| Oscillations | 26 | 38 |
| Waves | 24 | 38 |
| Physical Optics | 29 | 40 |
| Optical Instruments | 26 | 38 |
| Electrostatics | 32 | 53 |
| Current Electricity | 33 | 56 |
| Electromagnetism | 44 | 60 |
| Electromagnetic Induction | 40 | 56 |
| Alternating Current | 18 | 39 |
| Physics of Solids | 62 | 69 |
| Electronics | 58 | 70 |
| Dawn of Modern Physics | 35 | 54 |
| Atomic Spectra | 41 | 53 |
| Nuclear Physics | 81 | 101 |

### Quantitative Reasoning (333 verified of 517)

| Topic / chapter | Verified | Total |
|---|---:|---:|
| Arithmetic | 88 | 102 |
| Equations | 41 | 101 |
| Algebra and Functions | 32 | 103 |
| Geometry | 72 | 101 |
| Scenario-based / Mental Maths | 43 | 50 |
| Statistics | 57 | 60 |

### Verbal Reasoning (1,356 verified of 1,365)

| Topic / chapter | Verified | Total |
|---|---:|---:|
| Analogy | 198 | 200 |
| Sentence Completion | 172 | 179 |
| Comprehension | 50 | 50 |
| Synonyms / Antonyms | 936 | 936 |

## 5. Why questions need review

| Subject | Reason | Questions |
|---|---|---:|
| Biology | Duplicate | 6 |
| Biology | No printed option is correct | 15 |
| Biology | Option text unclear in the scan | 5 |
| Biology | Other | 1 |
| Chemistry | Duplicate | 1 |
| Chemistry | Option text unclear in the scan | 174 |
| Chemistry | Other | 1 |
| Chemistry | Question text differs from the checked edition | 13 |
| Physics | Duplicate | 3 |
| Physics | No printed option is correct | 9 |
| Physics | Option text unclear in the scan | 282 |
| Quantitative Reasoning | Duplicate | 3 |
| Quantitative Reasoning | No printed option is correct | 26 |
| Quantitative Reasoning | Option text unclear in the scan | 155 |
| Verbal Reasoning | Duplicate | 2 |
| Verbal Reasoning | No printed option is correct | 1 |
| Verbal Reasoning | Option text unclear in the scan | 6 |

## 6. Duplicates

16 duplicate pairs were found (same question and options). The later copy is kept for practice but excluded from mocks:

bio-0148 = bio-0151, bio-0627 = bio-0866, bio-1284 = bio-1331, bio-1538 = bio-1576, bio-1444 = bio-1580, bio-1702 = bio-1753, chem-0139 = chem-0140, chem-0496 = chem-0521, phy-0543 = phy-0560, phy-0737 = phy-0776, phy-0809 = phy-0818, qr-0034 = qr-0035, qr-0461 = qr-0468, qr-0481 = qr-0486, vr-0053 = vr-0082, vr-0426 = vr-0429

## 7. Shortage list (what the bank cannot cover yet)

| Category | Subject | MCQs in test | Verified in bank | Status |
|---|---|---:|---:|---|
| USAT-M | Physics | 8 | 713 | OK |
| USAT-M | Chemistry | 8 | 411 | OK |
| USAT-M | Biology | 14 | 2114 | OK |
| USAT-E | Physics | 10 | 713 | OK |
| USAT-E | Chemistry | 10 | 411 | OK |
| USAT-E | Mathematics | 10 | 0 | **Missing — no source PDF** |
| USAT-CS | Physics | 8 | 713 | OK |
| USAT-CS | Computer Science | 14 | 0 | **Missing — no source PDF** |
| USAT-CS | Mathematics | 8 | 0 | **Missing — no source PDF** |
| USAT-GS | Mathematics | 10 | 0 | **Missing — no source PDF** |
| USAT-GS | Statistics | 10 | 0 | **Missing — no source PDF** |
| USAT-GS | Economics | 10 | 0 | **Missing — no source PDF** |
| USAT-A | Islamiat / Ethics | 10 | 0 | **Missing — no source PDF** |
| USAT-A | Pakistan Studies | 10 | 0 | **Missing — no source PDF** |
| USAT-A | General Knowledge | 10 | 0 | **Missing — no source PDF** |
| USAT-COM | Accounting | 10 | 0 | **Missing — no source PDF** |
| USAT-COM | Commerce | 10 | 0 | **Missing — no source PDF** |
| USAT-COM | Economics | 10 | 0 | **Missing — no source PDF** |

Result: **full 75-question mocks are available only for USAT-M.** USAT-E (Mathematics) and USAT-CS (Computer Science, Mathematics) get partial tests; USAT-GS, USAT-A and USAT-COM get partial tests with Verbal + Quantitative only. The app shows the exact shortage before a partial test starts.

Also thin: verified Chemistry questions in Chemical Equilibrium (0 of 4) and Chemical Kinetics (2 of 6); QR Algebra and Functions (27 of 100) and Equations (38 of 100), where many options lost their maths notation in the scan. Checking those options against the printed book would add the most.

## 8. Essay module content

- 54 argument topic kits (thesis, three points, fact, quotations, counter-argument, tip) — 3 are bonus topics.
- 15 narrative prompts adapted from one core story; master argument (5 paragraphs) and narrative (4 paragraphs) templates; 10 universal paragraphs; hooks, transitions, phrase and vocabulary banks.
- 5 model essays, labelled “RAXUSATPrep model essay”. No AI scoring — students use a checklist and a 1–5 self-assessment.

## 9. Known limitations

- Maths notation in scanned options is the main source of unverified QR and Physics questions.
- Urdu essays use the system Urdu font (no web font is bundled).
- The pattern comes from the build brief and was not confirmed against an official HEC/ETC notice in this build.
