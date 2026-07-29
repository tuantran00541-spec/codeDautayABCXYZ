import numpy as np
from PIL import Image, ImageDraw, ImageFont
from app.config import DEFAULT_FONT, MIN_FONT_SIZE, MAX_FONT_SIZE


def parse_color(color_input, default=(0, 0, 0)) -> tuple[int, int, int]:
    if not color_input:
        return default
    if isinstance(color_input, (tuple, list)) and len(color_input) >= 3:
        return (int(color_input[0]), int(color_input[1]), int(color_input[2]))
    if isinstance(color_input, str):
        color_str = color_input.strip().lstrip("#")
        if color_str == "auto":
            return default
        if len(color_str) == 6:
            return (
                int(color_str[0:2], 16),
                int(color_str[2:4], 16),
                int(color_str[4:6], 16),
            )
    return default


def auto_detect_text_color(image: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int, int]:
    """Detect background brightness in box region and return white for dark bg, black for light bg."""
    x1, y1, x2, y2 = box
    crop = image.crop((x1, y1, x2, y2)).convert("L")
    arr = np.array(crop)
    if arr.size == 0:
        return (0, 0, 0)
    mean_bg = float(arr.mean())
    if mean_bg < 135:
        return (255, 255, 255)  # White text for dark background
    return (0, 0, 0)            # Black text for light background


def render_text_in_box(
    image: Image.Image,
    text: str,
    box: tuple[int, int, int, int],
    font_path=DEFAULT_FONT,
    padding: int = 6,
    fill=None,
) -> Image.Image:
    x1, y1, x2, y2 = box
    box_w = (x2 - x1) - padding * 2
    box_h = (y2 - y1) - padding * 2
    if box_w <= 0 or box_h <= 0 or not text.strip():
        return image

    # Determine text color: custom or auto-contrast
    if fill is None or fill == "auto" or fill == "":
        text_color = auto_detect_text_color(image, box)
    else:
        text_color = parse_color(fill, default=(0, 0, 0))

    # Stroke color is contrasting (black stroke for white text, white stroke for dark text)
    luminance = (text_color[0] * 299 + text_color[1] * 587 + text_color[2] * 114) / 1000
    stroke_color = (0, 0, 0) if luminance > 128 else (255, 255, 255)
    stroke_w = 2 if font_path else 1

    draw = ImageDraw.Draw(image)
    font_size, lines = _fit_text(draw, text, box_w, box_h, font_path)
    font = ImageFont.truetype(str(font_path), font_size)

    line_height = draw.textbbox((0, 0), "A", font=font)[3]
    total_h = line_height * len(lines)
    start_y = y1 + padding + (box_h - total_h) // 2

    for i, line in enumerate(lines):
        line_w = draw.textbbox((0, 0), line, font=font)[2]
        start_x = x1 + padding + (box_w - line_w) // 2
        draw.text(
            (start_x, start_y + i * line_height),
            line,
            font=font,
            fill=text_color,
            stroke_width=stroke_w,
            stroke_fill=stroke_color,
        )

    return image


def _fit_text(draw, text: str, box_w: int, box_h: int, font_path) -> tuple[int, list[str]]:
    for size in range(MAX_FONT_SIZE, MIN_FONT_SIZE - 1, -1):
        font = ImageFont.truetype(str(font_path), size)
        lines = _wrap_text(draw, text, font, box_w)
        line_height = draw.textbbox((0, 0), "A", font=font)[3]
        total_h = line_height * len(lines)
        max_line_w = max(draw.textbbox((0, 0), line, font=font)[2] for line in lines)
        if total_h <= box_h and max_line_w <= box_w:
            return size, lines
    return MIN_FONT_SIZE, _wrap_text(draw, text, ImageFont.truetype(str(font_path), MIN_FONT_SIZE), box_w)


def _wrap_text(draw, text: str, font, box_w: int) -> list[str]:
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        w = draw.textbbox((0, 0), candidate, font=font)[2]
        if w <= box_w or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

