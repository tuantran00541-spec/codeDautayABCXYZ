import numpy as np
import cv2
from PIL import Image


class MultiLangOCR:
    def __init__(self):
        self._manga_ocr = None
        self._paddle_engines = {}

    def read(self, image: np.ndarray, lang: str) -> str:
        prep = self._preprocess_for_ocr(image)
        if lang == "ja":
            return self._read_manga_ocr(prep)
        return self._read_paddle(prep, lang)

    @staticmethod
    def _preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
        """Preprocess text crop image to maximize OCR accuracy for colored / stylized text."""
        if image is None or image.size == 0:
            return image

        # Ensure image is 3-channel RGB
        if image.ndim == 2:
            gray = image
        else:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        # Invert if text is light on a dark background
        if float(gray.mean()) < 135:
            gray = cv2.bitwise_not(gray)

        # Apply CLAHE to boost contrast of colored / stylized text
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Convert back to 3-channel RGB image for OCR engines
        return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)

    def _read_manga_ocr(self, image: np.ndarray) -> str:
        if self._manga_ocr is None:
            from manga_ocr import MangaOcr
            self._manga_ocr = MangaOcr()
        pil_img = Image.fromarray(image)
        return self._manga_ocr(pil_img).strip()

    def _read_paddle(self, image: np.ndarray, lang: str) -> str:
        engine = self._get_paddle_engine(lang)
        result = engine.ocr(image, cls=True)
        if not result or not result[0]:
            return ""
        lines = [line[1][0] for line in result[0]]
        return "\n".join(lines).strip()

    def _get_paddle_engine(self, lang: str):
        if lang not in self._paddle_engines:
            from paddleocr import PaddleOCR
            self._paddle_engines[lang] = PaddleOCR(lang=lang, use_angle_cls=True, show_log=False)
        return self._paddle_engines[lang]

