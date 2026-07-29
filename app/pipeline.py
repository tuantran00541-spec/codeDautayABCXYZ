import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import cv2
import numpy as np
from app.downloader.registry import download_chapter as fetch_chapter_images
from app.downloader.slicer import slice_image
from app.detector.combined_detector import CombinedTextDetector
from app.detector.bubble_detector import BubbleBox
from app.inpaint.lama_inpainter import Inpainter
from app.config import RAW_DIR, PROCESSED_DIR


def read_image(path: Path) -> np.ndarray:
    data = np.fromfile(str(path), dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Could not read image at {path}")
    return img


def write_image(path: Path, image: np.ndarray) -> None:
    ext = path.suffix or ".png"
    success, buf = cv2.imencode(ext, image)
    if success:
        buf.tofile(str(path))
    else:
        cv2.imwrite(str(path), image)


class ChapterPipeline:
    def __init__(self):
        self.detector = CombinedTextDetector()
        self.inpainter = Inpainter()

    def download_chapter(self, chapter_url: str, chapter_id: str) -> dict:
        raw_dir = RAW_DIR / chapter_id
        sliced_dir = raw_dir / "sliced"
        processed_dir = PROCESSED_DIR / chapter_id
        sliced_dir.mkdir(parents=True, exist_ok=True)
        processed_dir.mkdir(parents=True, exist_ok=True)

        raw_paths = fetch_chapter_images(chapter_url, raw_dir)

        pages = []
        for source_index, raw_path in enumerate(raw_paths):
            slice_paths = slice_image(raw_path, sliced_dir, f"{source_index:03d}")
            for slice_index, slice_path in enumerate(slice_paths):
                pages.append({
                    "original": slice_path.as_posix(),
                    "clean": None,
                    "boxes": [],
                    "skipped": False,
                    "source_page": source_index,
                    "slice_index": slice_index,
                })

        manifest = {"chapter_id": chapter_id, "source_url": chapter_url, "pages": pages}
        self._save_manifest(processed_dir, manifest)
        return manifest

    def process_pages(self, chapter_id: str, page_indices: list[int]) -> dict:
        processed_dir = PROCESSED_DIR / chapter_id
        manifest = self._load_manifest(processed_dir)

        # Only keep pages that haven't been skipped
        work_items = [
            (idx, Path(manifest["pages"][idx]["original"]))
            for idx in page_indices
            if not manifest["pages"][idx]["skipped"]
        ]

        if work_items:
            # Process up to 4 pages in parallel.
            # Thread-safe because:
            #   - Each page writes to a unique file path (clean_<img_name>)
            #   - ONNX Runtime sessions are thread-safe for concurrent inference
            #   - The manifest dict is only updated after ALL threads complete
            max_workers = min(4, len(work_items))
            results: dict[int, dict] = {}

            def _process_one(item: tuple[int, Path]) -> tuple[int, dict]:
                idx, img_path = item
                return idx, self._process_page(img_path, processed_dir)

            with ThreadPoolExecutor(max_workers=max_workers) as pool:
                futures = {pool.submit(_process_one, item): item for item in work_items}
                for future in as_completed(futures):
                    idx, page_data = future.result()  # re-raises any exception from the thread
                    results[idx] = page_data

            for idx, page_data in results.items():
                manifest["pages"][idx].update(page_data)

        self._save_manifest(processed_dir, manifest)
        self._sync_output_dir(chapter_id, manifest)
        return manifest

    def mark_skipped(self, chapter_id: str, page_indices: list[int], skipped: bool) -> dict:
        processed_dir = PROCESSED_DIR / chapter_id
        manifest = self._load_manifest(processed_dir)
        for idx in page_indices:
            manifest["pages"][idx]["skipped"] = skipped
            if skipped:
                manifest["pages"][idx]["clean"] = manifest["pages"][idx]["original"]
                manifest["pages"][idx]["boxes"] = []
        self._save_manifest(processed_dir, manifest)
        self._sync_output_dir(chapter_id, manifest)
        return manifest

    @staticmethod
    def _sync_output_dir(chapter_id: str, manifest: dict) -> None:
        """Ensure OUTPUT_DIR contains 100% of chapter pages in exact 000, 001, 002 sequence.
        Bỏ qua các trang đã render bản dịch (page["rendered"]=True) để không ghi đè mất bản dịch."""
        from app.config import OUTPUT_DIR
        out_dir = OUTPUT_DIR / chapter_id
        out_dir.mkdir(parents=True, exist_ok=True)

        for i, page in enumerate(manifest["pages"]):
            if page.get("rendered"):
                continue

            target_path = out_dir / f"page_{i:03d}.png"
            clean_p = Path(page["clean"]) if page.get("clean") else None
            src_p = clean_p if (clean_p and clean_p.exists()) else Path(page["original"])

            if src_p and src_p.exists():
                img = read_image(src_p)
                write_image(target_path, img)


    def add_manual_box(self, chapter_id: str, page_index: int, x1: int, y1: int, x2: int, y2: int) -> dict:
        processed_dir = PROCESSED_DIR / chapter_id
        manifest = self._load_manifest(processed_dir)
        page = manifest["pages"][page_index]

        img_path = Path(page["original"])
        image = read_image(img_path)
        h, w = image.shape[:2]

        x1, x2 = sorted((max(0, min(x1, w)), max(0, min(x2, w))))
        y1, y2 = sorted((max(0, min(y1, h)), max(0, min(y2, h))))
        if x2 - x1 < 4 or y2 - y1 < 4:
            return manifest

        page["boxes"].append({"x1": x1, "y1": y1, "x2": x2, "y2": y2, "confidence": 1.0, "removed": False})
        self._reinpaint_page(page, image, processed_dir, img_path)

        self._save_manifest(processed_dir, manifest)
        self._sync_output_dir(chapter_id, manifest)
        return manifest

    def remove_box(self, chapter_id: str, page_index: int, box_index: int) -> dict:
        processed_dir = PROCESSED_DIR / chapter_id
        manifest = self._load_manifest(processed_dir)
        page = manifest["pages"][page_index]

        page["boxes"][box_index]["removed"] = True

        img_path = Path(page["original"])
        image = read_image(img_path)
        self._reinpaint_page(page, image, processed_dir, img_path)

        self._save_manifest(processed_dir, manifest)
        self._sync_output_dir(chapter_id, manifest)
        return manifest

    def repaint_mask(self, chapter_id: str, page_index: int, mask_png: bytes) -> dict:
        """Apply a user-drawn mask directly onto the current clean image."""
        processed_dir = PROCESSED_DIR / chapter_id
        manifest = self._load_manifest(processed_dir)
        page = manifest["pages"][page_index]

        # Prefer the already-cleaned image; fall back to original if none exists yet
        base_path = Path(page["clean"]) if page.get("clean") else Path(page["original"])
        if not base_path.exists():
            base_path = Path(page["original"])
        image = read_image(base_path)
        h, w = image.shape[:2]

        # Decode PNG mask sent from browser canvas
        mask_arr = np.frombuffer(mask_png, dtype=np.uint8)
        mask_decoded = cv2.imdecode(mask_arr, cv2.IMREAD_UNCHANGED)
        if mask_decoded is None:
            return manifest

        # Use alpha channel when available (browser canvas exports RGBA)
        if mask_decoded.ndim == 3 and mask_decoded.shape[2] == 4:
            mask = mask_decoded[:, :, 3]
        elif mask_decoded.ndim == 3:
            mask = cv2.cvtColor(mask_decoded, cv2.COLOR_BGR2GRAY)
        else:
            mask = mask_decoded

        # Resize mask to match the actual image dimensions
        mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
        mask = (mask > 127).astype(np.uint8) * 255

        if not mask.any():
            return manifest

        # Split mask into connected components so each disjoint painted region
        # gets its own crop / inpaint pass (much better quality than one big box)
        num_labels, labels = cv2.connectedComponents(mask)
        result = image.copy()
        for label in range(1, num_labels):  # 0 is background
            component_mask = ((labels == label).astype(np.uint8) * 255)
            # Skip tiny specks (< 100 px) that are likely brush accidents
            if component_mask.sum() // 255 < 100:
                continue
            result = self.inpainter.inpaint_mask(result, component_mask)

        img_path = Path(page["original"])
        out_path = processed_dir / f"clean_{img_path.name}"
        write_image(out_path, result)
        page["clean"] = out_path.as_posix()
        page["rendered"] = False

        self._save_manifest(processed_dir, manifest)
        self._sync_output_dir(chapter_id, manifest)
        return manifest

    def _reinpaint_page(self, page: dict, image, processed_dir: Path, img_path: Path) -> None:
        boxes = [
            BubbleBox(b["x1"], b["y1"], b["x2"], b["y2"], b["confidence"])
            for b in page["boxes"]
            if not b.get("removed")
        ]
        clean_image = self.inpainter.inpaint(image, boxes)

        clean_path = processed_dir / f"clean_{img_path.name}"
        write_image(clean_path, clean_image)
        page["clean"] = clean_path.as_posix()
        page["rendered"] = False

    @staticmethod
    def _load_manifest(processed_dir: Path) -> dict:
        manifest_path = processed_dir / "manifest.json"
        return json.loads(manifest_path.read_text(encoding="utf-8"))

    @staticmethod
    def _save_manifest(processed_dir: Path, manifest: dict) -> None:
        manifest_path = processed_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    def _process_page(self, img_path: Path, processed_dir: Path) -> dict:
        image = read_image(img_path)
        boxes = self.detector.detect(image)
        clean_image = self.inpainter.inpaint(image, boxes)

        clean_path = processed_dir / f"clean_{img_path.name}"
        write_image(clean_path, clean_image)

        return {
            "clean": clean_path.as_posix(),
            "boxes": [
                {"x1": b.x1, "y1": b.y1, "x2": b.x2, "y2": b.y2, "confidence": b.confidence}
                for b in boxes
            ],
        }

