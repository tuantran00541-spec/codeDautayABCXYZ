from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
OUTPUT_DIR = BASE_DIR / "data" / "output"
MODELS_DIR = BASE_DIR / "models"

BUBBLE_DETECTOR_MODEL = MODELS_DIR / "bubble_yolo.onnx"
TEXT_SEGMENTER_MODEL = MODELS_DIR / "text_segmenter.onnx"
LAMA_MODEL = MODELS_DIR / "lama.onnx"

BUBBLE_CONF_THRESHOLD = 0.4
BUBBLE_IOU_THRESHOLD = 0.3
TEXT_CONF_THRESHOLD = 0.20

INPAINT_SIZE = 512

SLICE_TARGET_HEIGHT = 1400
SLICE_SEARCH_WINDOW = 180
SLICE_MIN_HEIGHT = 500

DEFAULT_FONT = BASE_DIR / "app" / "static" / "fonts" / "default.ttf"
MIN_FONT_SIZE = 10
MAX_FONT_SIZE = 48

SUPPORTED_OCR_LANGS = ["ja", "ch", "korean", "en"]

HOST = "127.0.0.1"
PORT = 8000
