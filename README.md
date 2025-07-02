

---

# 🔧 AI-Based Face Image Restoration Web App

This project uses **GFPGAN** to restore old, blurry, or damaged face images using artificial intelligence. It provides a complete web-based UI built in **React** and a **Flask** backend for processing.

---

## 🗂️ Project Structure

```

IMAGE-RESTORATION/
├── flask\_api/                # Flask backend
│   ├── gfpgan/               # GFPGAN model code
│   ├── gfpgan\_env/           # Python virtual environment
│   ├── inputs/               # Input images for processing
│   ├── results/              # Processed output images
│   ├── static/
│   │   ├── results/          # Processed output images (web accessible)
│   │   └── uploads/          # Uploaded files
│   ├── templates/            # Flask templates (HTML)
│   ├── metrics.py            # Quality metric calculations (PSNR, SSIM, LPIPS)
│   └── app.py                # Main Flask application
│
├── frontend/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── ...               # Other React components
│   ├── package.json
│   └── README.md
│
├── .gitignore
├── README.md                 # ← You are here
└── requirements.txt          # Python dependencies

````

---

## 🧪 Features

- Upload old/damaged face images
- Detect individual faces
- Restore selected or all faces using GFPGAN
- View image quality metrics (PSNR, SSIM, LPIPS)
- Highlight best/worst restored faces
- Merge all restored faces into the original image
- Download restored faces individually or as ZIP
- Fully responsive React frontend

---

## 🚀 Getting Started

### 🐍 1. Backend (Flask + GFPGAN)

```bash
cd flask_api
python -m venv gfpgan_env
# For Windows:
gfpgan_env\Scripts\activate
# For macOS/Linux:
source gfpgan_env/bin/activate

pip install -r ../requirements.txt

# Run the Flask server
python app.py
````

---

### ⚛️ 2. Frontend (React)

```bash
cd frontend
npm install
npm start
```

Then open: [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📸 Example Use Case

1. Upload a family photo from the 1980s
2. Detect faces using AI
3. Restore them to sharp, high-quality versions
4. Download the enhanced version or view side-by-side comparisons with AI confidence scores

---

## 👨‍💻 Author

**Sanjilka Saxena** – created this project to demonstrate real-world AI integration with full-stack development.

---

## 🙏 Credits

* [GFPGAN (Tencent ARC)](https://github.com/TencentARC/GFPGAN)
* [LPIPS Metric](https://github.com/richzhang/PerceptualSimilarity)

---

### 🛠️ Tip for Developers

To activate the Python virtual environment on Windows PowerShell:

```bash
.\gfpgan_env\Scripts\Activate.ps1
```

```


