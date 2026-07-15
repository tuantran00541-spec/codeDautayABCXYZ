Manga/Manhwa Translation Pipeline

A semi-automated pipeline for translating manga/manhwa/manhua chapters into Vietnamese, built and run entirely on Google Colab with Google Drive as persistent storage. Free and open-source tools are used throughout — no paid APIs requiring international card verification, aside from the free tier of Groq.

This is a personal tool built to translate chapters for individual reading. Notebook comments and print output are in Vietnamese; this README is in English for wider accessibility.

Disclaimer

This tool is provided for personal and educational use only. It does not host, distribute, or include any copyrighted manga/manhwa content — it only automates OCR, translation, and typesetting on images the user supplies or downloads themselves. Manga/manhwa scanlations carry their own copyright and platform terms of use; you are solely responsible for how you use this tool and what content you process with it. Respect the rights of original creators and publishers, and support official releases where available.

What it does

Given a chapter link/ID, the pipeline:


Downloads the source page images
Detects speech bubbles and OCRs the text inside them
Machine-translates the text to Vietnamese
Erases (inpaints) the original text from the images
Opens an editor for you to review/fix the translation and re-render it onto the cleaned images
Packages the finished pages into a single .cbz file, ready for any comic reader


Steps 1–4 and 6 are automated; step 5 is manual by design — machine translation (even LLM-based) still gets context, pronouns, and tone wrong often enough that a human pass is worth keeping in the loop.

Architecture

Step 1 — Download        MangaDex API (at-home/server) → raw page images
Step 2 — OCR              YOLOv8 (bubble detection) → PaddleOCR (per-bubble text)
Step 3 — Translate        Groq API (LLM), English/source → Vietnamese
Step 4 — Inpaint          LaMa → erase original text from bubbles
Step 5 — Edit & typeset   Gradio UI → review/fix translation, render Vietnamese text
Step 6 (7 in notebook)    Package into .cbz, cleanup helper (optional)

All steps run inside a single notebook, 00_pipeline_full_paddleocr_fixed.ipynb, sharing one CHAPTER_ID across every step. Standalone versions of each step also exist as separate notebooks for debugging individual stages.

Why this stack


PaddleOCR + YOLOv8 bubble detection, not OCR-on-full-page: detecting speech bubbles first and cropping each one for OCR avoids the classic failure mode of comic OCR — mistaking the chapter title, logo, or page furniture for translatable dialogue. It also handles overlapping/multi-line bubbles more reliably than merging OCR regions after the fact.
Groq API for translation: free-tier LLM translation with meaningfully better quality than fully offline engines (e.g. Argos Translate), while still requiring no international card. A standalone LibreTranslate/Argos notebook is included as a fallback that needs no API key at all, at the cost of translation quality.
LaMa for inpainting: erases source text cleanly enough that Vietnamese text can be re-rendered into the same bubble without visible artifacts, without paying for a commercial inpainting API.
Isolated venvs per step: PaddleOCR, LaMa, and translation dependencies conflict with Colab's preinstalled numpy/scipy/torch stack if installed directly into the kernel. Each heavy step creates its own virtual environment and runs as a subprocess, communicating only through JSON files — the Colab kernel never imports these libraries directly.


Requirements


A Google account (Colab + Drive)
A free Groq API key for Step 3 (translation)
Nothing else — no paid APIs, no local install, no GPU of your own (Colab provides a free T4)


Setup


Open 00_pipeline_full_paddleocr_fixed.ipynb in Google Colab.
Add your Groq API key to Colab Secrets (🔑 icon in the left sidebar) under the name GROQ_API_KEY.
Set CHAPTER_ID in the first configuration cell to the ID of the chapter you want to translate (from its MangaDex URL, e.g. mangadex.org/chapter/<CHAPTER_ID>).
Run all cells top to bottom. Steps that install a venv (OCR, translation, inpainting) take a few minutes each on first run per session — Colab's temporary disk is wiped between sessions, so these install cells need to be re-run each time you open a new session (results already saved to Drive are not affected).
When you reach the Gradio step, open the printed .gradio.live link, review/edit each page's translation, and save.
Run the final step to package the finished pages into a .cbz file.


Known limitations


Single chapter, single user, one run at a time — no batch queue for translating many chapters unattended.
Runs on Colab's free tier, so it inherits Colab's session time limits and disk reset behavior.
Machine translation quality still requires a manual editing pass (by design — see above).
Currently coupled to MangaDex as the image source; other sources would need a small adapter around Step 1.


Repository structure


00_pipeline_full_paddleocr_fixed.ipynb — the full pipeline, run this one end to end
01_mangadex_downloader.ipynb — standalone Step 1 (download only)
02_ocr_paddleocr.ipynb — standalone Step 2 (OCR only)
03_translate_*.ipynb — standalone Step 3 (translation only; Groq and LibreTranslate/Argos variants)
Additional standalone notebooks for inpainting and the Gradio editor


The standalone notebooks are useful for debugging a single stage in isolation; the unified notebook is the one meant for actual day-to-day use.
