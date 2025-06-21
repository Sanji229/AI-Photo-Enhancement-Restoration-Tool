from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import cv2
import sys
import uuid

# Add gfpgan path to import GFPGANer
sys.path.append(os.path.join(os.path.dirname(__file__), 'gfpgan'))

from gfpganer import GFPGANer  # Import GFPGANer from your local gfpgan folder

app = Flask(__name__)
CORS(app)

# Create directories
os.makedirs('inputs', exist_ok=True)
os.makedirs('static/results', exist_ok=True)

# Load GFPGAN
gfpganer = GFPGANer(
    model_path='gfpgan/weights/GFPGANv1.3.pth',
    upscale=2,
    arch='clean',
    channel_multiplier=2,
    bg_upsampler=None
)

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    mode = request.form.get('mode', 'face')  # will still accept mode (but only GFPGAN will run)
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    input_path = os.path.join('inputs', filename)
    output_path = os.path.join('static/results', filename)
    file.save(input_path)

    try:
        # Only run GFPGAN restoration regardless of mode
        _, _, restored_img = gfpganer.enhance(
            input_path,
            has_aligned=False,
            only_center_face=False,
            paste_back=True
        )
        cv2.imwrite(output_path, restored_img)
        return jsonify({'restored_image': f'/static/results/{filename}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/static/results/<path:filename>')
def serve_file(filename):
    return send_from_directory('static/results', filename)

if __name__ == '__main__':
    app.run(debug=True)
