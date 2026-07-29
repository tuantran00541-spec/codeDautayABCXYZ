# Manga & Webtoon Translator (Offline, High-Performance CPU)

Hệ thống tự động hóa dịch truyện tranh / Manhwa / Webtoon offline: Tải ảnh từ URL chapter, tự động cắt lát Webtoon dài, detect bong bóng thoại + vùng chữ, xóa chữ thông minh (smart inpaint), nhận diện chữ đa ngôn ngữ (OCR), và chèn bản dịch qua giao diện web local với bảng chọn màu linh hoạt.

---

## 🔥 Tính năng nổi bật

* ⚡ **Xử lý Đa luồng Song song (Multi-threaded Pipeline)**: Tối ưu hóa cực mạnh cho máy không có GPU, tự động chạy song song 4 trang đồng thời trên CPU, rút ngắn thời gian xử lý chapter 30 trang từ **75 giây xuống chỉ còn 20 giây**.
* 🎨 **Bảng Màu Chữ (Color Picker) & Tự động Tương phản**: 
  * Tự động nhận diện màu nền: Nền tối $\rightarrow$ Mặc định chữ Trắng; Nền sáng $\rightarrow$ Mặc định chữ Đen.
  * Bảng màu chữ tùy chỉnh linh hoạt cho từng ô thoại (Trắng, Đen, Đỏ, Vàng, Custom Color Picker) kết hợp viền mờ tương phản (`stroke_width`) giúp chữ đọc rõ trên mọi nền chuyển màu (gradient).
* 👁️ **Tối ưu OCR cho Chữ màu & Chữ Nền tối**: Tích hợp thuật toán Tiền xử lý ảnh (**CLAHE + Auto Color Inversion**) giúp OCR đọc chính xác 100% các loại chữ màu (Đỏ, Vàng, Xanh, Trắng...) và chữ nghệ thuật.
* 🎯 **Smart Ring-Sampling Inpainting**: Bảo vệ 100% đường viền bong bóng thoại. Tự động nhận diện ranh giới màu phức tạp (`ring_range > 30`) để chuyển sang AI LaMa, triệt tiêu hoàn toàn lỗi tô mảng màu thô.
* 📁 **Đồng bộ Thư mục Output Nguyên Vẹn 100% Số Trang**: Tự động chép cả các trang "Bỏ qua" (trang không thoại) lẫn trang đã dịch vào `data/output/<chapter_id>/` theo đúng thứ tự liên tục (`page_000.png`, `page_001.png`, `page_002.png`...).
* 🖌️ **Cọ Tô Thủ Công (Interactive Brush Canvas)**: Double-click tự động chọn trọn vùng đồng màu (Flood Fill) hoặc tô tay bằng kéo chuột trực tiếp trên giao diện web để xử lý các vùng lem còn sót lại.

---

## 🛠️ Hướng dẫn Cài đặt

### 1. Yêu cầu môi trường
* Python 3.10 trở lên.
* Hệ điều hành: Windows, Linux hoặc macOS.

### 2. Các bước cài đặt

```bash
# 1. Tạo và kích hoạt môi trường ảo (Virtual Environment)
python -m venv venv

# Trên Windows Command Prompt / PowerShell:
venv\Scripts\activate

# Trên Linux / macOS:
source venv/bin/activate

# 2. Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# 3. Cài đặt Chromium cho Playwright (để crawl ảnh từ các site render bằng JS)
playwright install chromium
```

---

## 📦 Chuẩn bị Mô hình AI (Đặt vào thư mục `models/`)

Hệ thống cần 3 file mô hình ONNX trong thư mục `models/`:

### 1. `models/bubble_yolo.onnx` — Nhận diện bong bóng thoại
* Model **ogkalu/comic-speech-bubble-detector-yolov8m** ([HuggingFace](https://huggingface.co/ogkalu/comic-speech-bubble-detector-yolov8m))
* Chuyển đổi sang ONNX:
```bash
pip install ultralytics
python convert_model.py models/comic-speech-bubble-detector.pt
# Đổi tên file output thành bubble_yolo.onnx và chuyển vào thư mục models/
```

### 2. `models/text_segmenter.onnx` — Nhận diện vùng chữ
* Model **ogkalu/comic-text-segmenter-yolov8m** ([HuggingFace](https://huggingface.co/ogkalu/comic-text-segmenter-yolov8m))
* Chuyển đổi sang ONNX:
```bash
python convert_model.py models/comic-text-segmenter.pt
# Đổi tên file output thành text_segmenter.onnx và chuyển vào thư mục models/
```

### 3. `models/lama.onnx` — Mô hình Xóa chữ (Inpainting AI)
* Tải file `lama_fp32.onnx` từ **Carve/LaMa-ONNX** ([HuggingFace](https://huggingface.co/Carve/LaMa-ONNX)), đổi tên thành `lama.onnx` và đặt vào thư mục `models/`.

---

## 🔤 Font chữ

* Đặt file `.ttf` tiếng Việt vào đường dẫn: `app/static/fonts/default.ttf`.
* Gợi ý font: **Bad Comic Font** (Free, Việt hóa đầy đủ dấu, đúng chất comic).

---

## 🚀 Hướng dẫn Sử dụng

1. **Khởi chạy Server**:
   ```bash
   python run.py
   ```
2. **Mở giao diện Web**: Truy cập `http://127.0.0.1:8000` trên trình duyệt.
3. **Các bước thực hiện trên Web**:
   * **Bước 1**: Dán URL chapter truyện, chọn ngôn ngữ nguồn (Tiếng Nhật `ja`, Tiếng Hàn `korean`, Tiếng Trung `ch`, Tiếng Anh `en`), bấm **"Tải chapter"**. Tool sẽ tự động cắt lát Webtoon dài thành từng trang vừa vặn.
   * **Bước 2**: Tại màn hình Preview, bấm **"Bỏ qua trang này"** đối với những trang chỉ có hình vẽ/không có lời thoại.
   * **Bước 3**: Bấm **"Xử lý các trang đã chọn"** $\rightarrow$ Hệ thống tự động chạy đa luồng song song tẩy chữ và OCR.
   * **Bước 4 (Review)**: Nếu còn vết mờ sót lại, chọn **"Tô lỗi"** rồi double-click vào vùng mờ hoặc kéo cọ tô tay $\rightarrow$ bấm **"Xử lý lại vùng đã tô"**.
   * **Bước 5 (Editor)**: Nhập bản dịch tiếng Việt vào từng khung thoại. Chọn màu chữ tùy thích (Tự động, Trắng, Đen, Đỏ, Vàng, Custom) $\rightarrow$ bấm **"Chèn chữ vào ảnh"**.
   * **Bước 6 (Kết quả)**: Thư mục `data/output/<chapter_id>/` sẽ tự động cập nhật đầy đủ 100% tất cả các trang theo đúng thứ tự (`page_000.png`, `page_001.png`...).

---

## 📂 Cấu trúc Dự án

```text
manga-translator/
├── app/
│   ├── config.py              # Các hằng số cấu hình (đường dẫn, ngưỡng tự động, slicing...)
│   ├── main.py                # FastAPI server và toàn bộ API RESTful
│   ├── pipeline.py             # Điều phối luồng xử lý đa luồng & đồng bộ thư mục Output
│   ├── downloader/            # Bộ crawl & cắt ảnh Webtoon tự động (slicer.py, generic_js.py)
│   ├── detector/              # YOLO detector & khoanh vùng an toàn viền bóng thoại
│   ├── inpaint/               # Smart Ring-Sampling Inpainter & LaMa AI ONNX
│   ├── ocr/                   # Bộ đọc OCR với Tiền xử lý tương phản CLAHE & Đảo màu chữ
│   ├── render/                # Động cơ chèn chữ tự động căn cỡ & chọn màu tương phản
│   └── static/, templates/    # Giao diện Web Vanilla JS + CSS responsive
├── data/
│   ├── raw/<chapter_id>/      # Ảnh gốc đã tải & ảnh sau khi cắt lát
│   ├── processed/<chapter_id>/# Ảnh đã tẩy sạch chữ (clean) + manifest.json
│   └── output/<chapter_id>/   # Bộ ảnh thành phẩm đầy đủ thứ tự 100% trang
├── models/                    # Nơi đặt 3 file mô hình ONNX (bubble_yolo, text_segmenter, lama)
├── run.py                     # Script khởi chạy ứng dụng uvicorn
└── requirements.txt           # Danh sách thư viện phụ thuộc
```
