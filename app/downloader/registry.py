from pathlib import Path
from bs4 import BeautifulSoup
import requests
from app.downloader.base import BaseAdapter
from app.downloader.generic_js import GenericJsAdapter


class GenericStaticAdapter(BaseAdapter):
    img_selector = "img"

    def can_handle(self, url: str) -> bool:
        return True

    def extract_image_urls(self, chapter_url: str) -> list[str]:
        resp = requests.get(chapter_url, headers=self.headers, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        urls = []
        for img in soup.select(self.img_selector):
            src = img.get("data-src") or img.get("src")
            if src and src.startswith("http"):
                urls.append(src)
        return urls


STATIC_ADAPTER = GenericStaticAdapter()
JS_ADAPTER = GenericJsAdapter()


def download_chapter(chapter_url: str, output_dir: Path) -> list[Path]:
    paths = STATIC_ADAPTER.download(chapter_url, output_dir)
    if paths:
        return paths
    return JS_ADAPTER.download(chapter_url, output_dir)
