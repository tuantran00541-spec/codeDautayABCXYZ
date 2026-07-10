Voice Forge AI – Voice Cloning Web Application
Voice Forge is a full-stack AI voice cloning system that enables you to generate natural-sounding speech in English, Japanese, and Vietnamese using cloned character voices. It consists of a backend API server running on Google Colab (the .ipynb notebook) and a frontend web interface (index.html).

System Overview
Component	File	Role
Backend (Server)	Voice_Cloning_API_Server.ipynb	Hosts XTTS-v2 and viXTTS models, exposes a REST API via FastAPI, and tunnels the server to the internet using ngrok.
Frontend (Client)	index.html	Provides a clean browser interface for selecting voices, entering text, and playing/downloading generated audio.
Prerequisites
A Google account (to run the Colab notebook).

A modern web browser (Chrome, Edge, Firefox, or Safari).

(Optional) A free ngrok account – the notebook includes a built‑in token, but you can replace it with your own if needed.

Part 1 – Backend Setup (Google Colab)
This section walks you through running the AI models and generating a public API URL.

1.1 Open the Notebook
Upload the .ipynb file to your Google Drive and open it with Google Colab, or go to colab.research.google.com and upload it directly.

1.2 Enable GPU Acceleration
In the top menu, select Runtime > Change runtime type.

Set Hardware accelerator to T4 GPU.

Click Save.

1.3 Execute Cells in the Correct Order (Mandatory)
The notebook has a known version‑conflict bug that requires a one‑time kernel restart. Follow these steps exactly:

Run Cell "Step 1" – installs the core Python libraries.

Run Cell "Step 1.5" – downgrades the transformers library.

Immediately after Step 1.5 finishes for the first time, go to Runtime > Restart session. This resets the Python kernel.

After the restart, run "Step 1" again.

Then run "Step 1.5" a second time.

Now run all remaining cells in sequence from Step 2 through Step 8:

Step 2 – downloads sample audio files from Google Drive.

Step 2.5 – sets environment variables to disable TensorFlow checks.

Step 3 – downloads the XTTS‑v2 model (English / Japanese).

Step 4 – downloads the viXTTS model (~1.9 GB, for Vietnamese).

Step 5 – applies patches for Vietnamese text normalization.

Step 6 – pre‑computes speaker conditioning latents.

Step 7 – defines the FastAPI endpoints.

Step 8 – starts the server and establishes the ngrok tunnel.

1.4 Retrieve the Public API URL
Once Step 8 completes, look for console output like this:

text
============================================================
API đang chạy công khai tại: https://xxxx.ngrok-free.app
============================================================
Copy this URL (e.g., https://abc123.ngrok-free.app). You will need it for the web app.

Critical: Keep the Colab tab open and active. Closing it or losing the session will terminate the API server.

Part 2 – Frontend Setup (Web App)
Now you will connect the index.html interface to the running backend.

2.1 Open the Web App
Save index.html to your local machine.

Double‑click the file to open it in your browser, or right‑click and choose Open with your preferred browser.

2.2 Configure the API Endpoint
At the bottom of the page, click the link that says "⚙ Cấu hình địa chỉ API" (Configure API URL).

An input field will appear. Paste the ngrok URL you copied from Colab into this field.

Press Enter or click outside the input box to save it. The URL is stored in your browser’s local storage.

2.3 Verify Connection Status
Look at the top‑right corner of the page. A status dot will indicate the connection state:

🟢 Green – the API is reachable and ready.

🔴 Red – the API is unreachable. Check your Colab session and the URL.

Part 3 – Using the Application
Once the backend is running and the frontend is connected, you can generate speech.

3.1 Select a Voice
In the "Select Voice" panel, click on any voice card (e.g., evernight, Phainon, Castorice, Aglaea).

The selected card will be highlighted with a blue border.

3.2 Choose a Language
Below the voice cards, click one of the language pills: English, 日本語 (Japanese), or Tiếng Việt (Vietnamese).

Only languages supported by the selected voice are enabled.

3.3 Enter Your Text
In the large text area labeled "Text Input", type or paste your content.

The character counter shows your progress toward the 500‑character limit.

You may use punctuation, line breaks, and emojis (though emojis may be ignored or pronounced literally).

3.4 Generate Audio
Click the green "Generate Speech" button.

The button will show a loading spinner and display a processing message. Generation typically takes 10 to 40 seconds, depending on text length and server load.

Wait patiently – do not close the tab or refresh the page during generation.

3.5 Listen and Download
When processing finishes, the "Result" panel appears with an embedded audio player.

Click the play button to preview the audio.

Click "Download" to save the output as a .wav file.

Click "Regenerate" to re‑run the same request, or simply adjust the text/voice and click the main button again.

Troubleshooting Guide
Issue	Likely Cause & Solution
"API not configured"	Paste the ngrok URL into the configuration input at the bottom of the page.
Status dot remains red	The Colab session may have disconnected. Restart Step 8 to get a new ngrok URL and update it in the web app.
"Backend should be defined..." (Colab error)	You skipped the mandatory restart after Step 1.5. Go back to Part 1.3 and follow the restart sequence precisely.
Generation fails with HTTP 500	Check the Colab output for Python stack traces. Often, simply restarting the runtime and re‑running all cells resolves transient memory issues.
Vietnamese output sounds choppy	The viXTTS model is sensitive to punctuation. Break long sentences with periods (.), exclamation marks (!), or question marks (?).
ngrok URL has expired	ngrok URLs are temporary. Whenever you restart the Colab runtime, a new URL is generated. Always copy the new URL and paste it into the web app again.
Audio is cut off or too fast	This can occur with very short texts (< 3 words) or certain Japanese characters. Try lengthening the input slightly or simplifying punctuation.
Important Final Notes
Keep Colab alive – the server runs only while the Colab notebook session is active.

Update the web app URL after every Colab restart – the old ngrok link will not work.

Supported languages: en (English), ja (Japanese), vi (Vietnamese).

Maximum text length: 500 characters per request.

The models are optimised for natural character voices – results are best when the input text matches the language of the sample audio used for cloning.

License & Credits
This project uses:

Coqui XTTS‑v2 – multilingual text‑to‑speech.

viXTTS – fine‑tuned for Vietnamese.

FastAPI – API framework.

ngrok – public tunnelling.

Google Colab – cloud GPU infrastructure.

For internal use and experimentation only. All character voice samples are property of their respective copyright holders and are used solely for demonstration purposes.

