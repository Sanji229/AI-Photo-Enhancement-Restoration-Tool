<<<<<<< HEAD
# Image_face_restoration
=======
# 🧠 Image & Face Restoration using GFPGAN + Real-ESRGAN

This project is a web-based AI image restoration tool built using Flask, GFPGAN, and Real-ESRGAN. It allows users to restore faces (GFPGAN) and enhance image resolution (Real-ESRGAN), or apply both sequentially.

## 📁 Project Structure

image_restoration/
├── flask_api/
│ ├── app.py
│ ├── inputs/
│ ├── static/results/gfpgan/
│ ├── static/results/realesrgan/
│ ├── gfpgan/weights/GFPGANv1.3.pth
│ └── realesrgan/
│ ├── weights/RealESRGAN_x4plus.pth
│ └── archs/rrdbnet_arch.py
├── requirements.txt
└── README.md


## 🚀 Features

- Face Restoration using GFPGAN
- Full Image Super-Resolution using Real-ESRGAN
- Combined Mode (Face + Resolution Enhancement)
- REST API support for image upload and download

## 🔧 Installation

1. Clone the repo:


git clone https://github.com/TencentARC/GFPGAN.git
git clone https://github.com/xinntao/Real-ESRGAN.git



2. Create a virtual environment and activate it:



cd image_restoration
python -m venv venv
venv\Scripts\activate

3. Install the requirements:


pip install -r requirements.txt

4. Download pretrained weights:

GFPGANv1.3.pth: Place it in flask_api/gfpgan/weights/



RealESRGAN_x4plus.pth: Place it in flask_api/realesrgan/weights/



5. Run the Flask server:


cd flask_api
python app.py


6. 📬 API Endpoint
POST /restore
Form Data:

image: Image file

mode: gfpgan, realesrgan, or both

GET /download/<filename>
Downloads the processed image.

7. 🧠 Credits
GFPGAN

Real-ESRGAN

>>>>>>> 06a0714 (Fix: removed embedded Git repo from gfpgan)
