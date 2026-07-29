import json
import numpy as np
import uuid
from pathlib import Path
import cv2
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from PIL import Image

from app.pipeline import ChapterPipeline
from app.ocr.multi_lang_ocr import MultiLangOCR
from app.render.text_renderer import render_text_in_box
from app.config import PROCESSED_DIR, OUTPUT_DIR, BASE_DIR

app = FastAPI()
pipeline = ChapterPipeline()
ocr = MultiLangOCR()

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "app" / "static")), name="static")
app.mount("/data", StaticFiles(directory=str(BASE_DIR / "data")), name="data")


def to_url(path_str: str) -> str:
    if not path_str:
        return path_str
    p = Path(path_str)
    if not p.is_absolute():
        p = (BASE_DIR / p).resolve()
    return "/" + p.relative_to(BASE_DIR).as_posix()


def urlify_manifest(manifest: dict) -> dict:
    result = json.loads(json.dumps(manifest))
    for page in result["pages"]:
        page["original"] = to_url(page["original"])
        page["clean"] = to_url(page["clean"]) if page["clean"] else page["clean"]
    return result


class ChapterRequest(BaseModel):
    url: str


class OcrBoxRequest(BaseModel):
    chapter_id: str
    page_index: int
    box_index: int
    lang: str


class RenderRequest(BaseModel):
    chapter_id: str
    page_index: int
    translations: dict[int, str]
    colors: dict[str, str] = {}


class ProcessPagesRequest(BaseModel):
    chapter_id: str
    page_indices: list[int]


class SkipPagesRequest(BaseModel):
    chapter_id: str
    page_indices: list[int]
    skipped: bool


class AddBoxRequest(BaseModel):
    chapter_id: str
    page_index: int
    x1: int
    y1: int
    x2: int
    y2: int


class RemoveBoxRequest(BaseModel):
    chapter_id: str
    page_index: int
    box_index: int


@app.post("/api/chapter")
def create_chapter(req: ChapterRequest):
    chapter_id = uuid.uuid4().hex[:8]
    manifest = pipeline.download_chapter(req.url, chapter_id)
    return urlify_manifest(manifest)


@app.post("/api/process_pages")
def process_pages(req: ProcessPagesRequest):
    manifest = pipeline.process_pages(req.chapter_id, req.page_indices)
    return urlify_manifest(manifest)


@app.post("/api/skip_pages")
def skip_pages(req: SkipPagesRequest):
    manifest = pipeline.mark_skipped(req.chapter_id, req.page_indices, req.skipped)
    return urlify_manifest(manifest)


@app.post("/api/add_box")
def add_box(req: AddBoxRequest):
    manifest = pipeline.add_manual_box(
        req.chapter_id, req.page_index, req.x1, req.y1, req.x2, req.y2
    )
    return urlify_manifest(manifest)


@app.post("/api/remove_box")
def remove_box(req: RemoveBoxRequest):
    manifest = pipeline.remove_box(req.chapter_id, req.page_index, req.box_index)
    return urlify_manifest(manifest)


@app.post("/api/repaint_mask")
async def repaint_mask(
    chapter_id: str = Form(...),
    page_index: int = Form(...),
    mask: UploadFile = File(...),
):
    mask_bytes = await mask.read()
    manifest = pipeline.repaint_mask(chapter_id, page_index, mask_bytes)
    return urlify_manifest(manifest)


def _load_manifest_raw(chapter_id: str) -> dict:
    manifest_path = PROCESSED_DIR / chapter_id / "manifest.json"
    return json.loads(manifest_path.read_text(encoding="utf-8"))


@app.get("/api/chapter/{chapter_id}")
def get_chapter(chapter_id: str):
    return urlify_manifest(_load_manifest_raw(chapter_id))


@app.post("/api/ocr_box")
def ocr_box(req: OcrBoxRequest):
    manifest = _load_manifest_raw(req.chapter_id)
    page = manifest["pages"][req.page_index]
    box = page["boxes"][req.box_index]

    data = np.fromfile(page["original"], dtype=np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)
    crop = image[box["y1"]:box["y2"], box["x1"]:box["x2"]]
    crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)

    text = ocr.read(crop_rgb, req.lang)
    return {"text": text}


@app.post("/api/render")
def render_page(req: RenderRequest):
    manifest = _load_manifest_raw(req.chapter_id)
    page = manifest["pages"][req.page_index]

    base_image_path = page.get("clean") or page.get("original")
    image = Image.open(base_image_path).convert("RGB")
    colors_dict = req.colors or {}

    for box_idx_str, translation in req.translations.items():
        box_idx = int(box_idx_str)
        if box_idx >= len(page["boxes"]) or page["boxes"][box_idx].get("removed"):
            continue
        box = page["boxes"][box_idx]
        coords = (box["x1"], box["y1"], box["x2"], box["y2"])
        box_color = colors_dict.get(box_idx_str) or colors_dict.get(box_idx) or "auto"
        image = render_text_in_box(image, translation, coords, fill=box_color)

    out_dir = OUTPUT_DIR / req.chapter_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"page_{req.page_index:03d}.png"
    image.save(out_path)

    page["rendered"] = True
    manifest_path = PROCESSED_DIR / req.chapter_id / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    return {"output": to_url(out_path.as_posix())}


@app.get("/api/download/{chapter_id}/{page_index}")
def download_page(chapter_id: str, page_index: int):
    path = OUTPUT_DIR / chapter_id / f"page_{page_index:03d}.png"
    return FileResponse(path)


@app.get("/")
def index():
    return FileResponse("app/templates/index.html")
