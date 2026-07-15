# Manga/Manhwa Translation Pipeline

A semi-automated Google Colab notebook that translates a manga/manhwa chapter into Vietnamese — from a MangaDex link to a ready-to-read `.cbz` file — using free and open-source tools only (no paid APIs requiring an international card, aside from Groq's free tier).

Built for personal use. Notebook comments and print output are in Vietnamese; this README is in English.

## Disclaimer

This is a personal tool for translating chapters for individual reading. It does not host or distribute any copyrighted content — it only processes images the user supplies. Scanlations carry their own copyright; **you are responsible for what you do with this tool.** Support official releases where available.

## What it does

```
1. Download    → pull chapter pages from a MangaDex link
2. OCR          → YOLOv8 finds speech bubbles, PaddleOCR reads the text inside each one
3. Translate    → Groq (LLM) translates the text to Vietnamese
4. Clean up     → auto-filter chapter titles/logos so they don't get erased by mistake
5. Inpaint      → LaMa erases the original text from the bubbles
6. Edit         → a Gradio UI to review/fix each translation and render Vietnamese text back in
7. Export       → package the finished pages into a single .cbz file
```

Everything runs in one notebook, top to bottom, sharing a single `CHAPTER_ID`. Step 6 is the one manual step by design — machine translation still needs a human pass for tone, pronouns, and context.

### Why this stack

- **YOLOv8 bubble detection before OCR**, instead of OCR-ing the full page: this is what stops chapter titles, logos, and page furniture from being misread as dialogue and mistakenly erased.
- **Groq** for translation: free, and noticeably better quality than fully offline engines, without needing an international card.
- **LaMa** for inpainting: erases the original text cleanly enough to re-render Vietnamese into the same bubble.
- **Isolated venvs per heavy step** (OCR, inpainting): these libraries conflict with Colab's preinstalled numpy/scipy/torch if installed straight into the kernel, so each one gets its own virtual environment and runs as a subprocess.

## Requirements

- A Google account (Colab + Drive)
- A free [Groq API key](https://console.groq.com)
- Nothing else — Colab's free T4 GPU is enough

## Setup

1. Open `00_pipeline_full_paddleocr_fixed.ipynb` in Google Colab.
2. Add your Groq key to Colab Secrets (🔑 in the left sidebar) as `GROQ_API_KEY`.
3. In the config cell (Step 0), set `CHAPTER_ID` to the chapter you want, taken from its MangaDex URL:
   `mangadex.org/chapter/<CHAPTER_ID>` → that ID.
4. **Run cells one at a time, top to bottom — do not use "Run all."** The Gradio step (6) needs you to actually open its link and save each page before moving on; running everything unattended will produce an incomplete `.cbz`.
5. Steps that build a venv (2, 5) take a few minutes each on first run per session — Colab's temp disk resets between sessions, so these need re-running each new session (Drive-saved results are unaffected).
6. At Step 6, open the printed `.gradio.live` link, review/edit the translation for every page, and hit **Save this page** for each one — including pages you don't need to change.
7. Step 7 checks that every page was saved before it lets you build the `.cbz`; if any are missing, it tells you exactly which ones.

## If a chapter isn't in English

Source images from MangaDex may already be in a language other than English (Spanish, Portuguese, etc.), not just Korean/Japanese/Chinese. Two settings need to match the actual language in the images — missing either one means Step 2 misreads the text or Step 3 mistranslates it:

| Setting | Where | Format | Example |
|---|---|---|---|
| `LANG` | Step 2 (OCR) | short language code | `en`, `es`, `korean`, `japan` |
| `FROM_LANG` | Step 3 (Translate) | full English name | `English`, `Spanish`, `Korean` |

Check a page or two in `RAW_DIR` before running Step 2 to confirm the source language. After changing `LANG`, re-run from the start of Step 2 — not just Step 3.

## Cleanup (optional, Step 7.5)

Each chapter keeps several copies of its images across `raw/`, `inpainted/`, `masks/`, and `final/`, which adds up over many chapters. Step 7.5 is a separate, opt-in cell — it never runs automatically — that deletes the intermediate folders once you have a working `.cbz`.

It requires manually setting `CLEANUP_MODE` to `"keep_ocr"` (deletes images, keeps the lightweight translation JSON so you can revise it later without re-OCRing) or `"full"` (deletes everything except the `.cbz`). It also refuses to run unless a valid `.cbz` already exists.

## Known limitations

- One chapter, one user, one run at a time — no batch queue.
- Runs on Colab's free tier, so it inherits Colab's session limits and disk reset behavior.
- Translation quality still needs the manual editing pass in Step 6.
- Coupled to MangaDex as the image source.
