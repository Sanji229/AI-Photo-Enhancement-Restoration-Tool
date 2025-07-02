from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os, cv2, sys, uuid, zipfile
import numpy as np
import torch
from pytorch_msssim import ssim as calculate_ssim

# Optional LPIPS import
try:
    import lpips
    loss_fn_alex = lpips.LPIPS(net='alex')
    use_lpips = True
except Exception as e:
    print("LPIPS not available:", e)
    use_lpips = False

sys.path.append(os.path.join(os.path.dirname(__file__), 'gfpgan'))
from gfpgan import GFPGANer

app = Flask(__name__)
CORS(app)

os.makedirs('inputs', exist_ok=True)
os.makedirs('static/results', exist_ok=True)
os.makedirs('static/zip', exist_ok=True)

gfpganer = GFPGANer(
    model_path='gfpgan/weights/GFPGANv1.3.pth',
    upscale=2,
    arch='clean',
    channel_multiplier=2,
    bg_upsampler=None
)

def compute_metrics(original, restored):
    try:
        original = cv2.resize(original, (restored.shape[1], restored.shape[0]))
        mse = np.mean((original - restored) ** 2)
        psnr = float('inf') if mse == 0 else 20 * np.log10(255.0 / np.sqrt(mse))
        original_tensor = torch.tensor(original / 255., dtype=torch.float32).permute(2, 0, 1).unsqueeze(0)
        restored_tensor = torch.tensor(restored / 255., dtype=torch.float32).permute(2, 0, 1).unsqueeze(0)
        ssim_val = calculate_ssim(original_tensor, restored_tensor, data_range=1.0).item()
        lpips_val = None
        if use_lpips:
            lpips_val = loss_fn_alex(original_tensor, restored_tensor).item()
        return {
            "psnr": round(psnr, 2),
            "ssim": round(ssim_val, 4),
            "lpips": round(lpips_val, 4) if lpips_val is not None else "N/A"
        }
    except Exception as e:
        print("Metric computation error:", e)
        return {"psnr": 0.0, "ssim": 0.0, "lpips": "N/A"}

@app.route('/detect_faces', methods=['POST'])
def detect_faces():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded', 'faces': []}), 400

        file = request.files['image']
        filename = os.path.basename(file.filename)
        input_path = os.path.join('inputs', filename)
        file.save(input_path)

        img = cv2.imread(input_path)
        max_dim = 1024
        if max(img.shape[:2]) > max_dim:
            scale = max_dim / max(img.shape[:2])
            img = cv2.resize(img, (int(img.shape[1]*scale), int(img.shape[0]*scale)))
            cv2.imwrite(input_path, img)

        cropped_faces, _, _ = gfpganer.enhance(img, has_aligned=False, only_center_face=False, paste_back=False)

        face_entries = []
        for i, face in enumerate(cropped_faces, start=1):
            face_filename = f"{uuid.uuid4().hex}_face_{i}.jpg"
            face_path = os.path.join('static/results', face_filename)
            cv2.imwrite(face_path, face)
            face_entries.append({
                "index": i,
                "url": f"/static/results/{face_filename}"
            })

        return jsonify({
            'faces': face_entries,
            'original_image_path': input_path  # ✅ this line added
        })
    except Exception as e:
        return jsonify({'error': str(e), 'faces': []}), 500


@app.route('/restore_faces', methods=['POST'])
def restore_faces():
    try:
        data = request.get_json()
        face_entries = data.get('face_paths', [])
        restored_entries = []
        for entry in face_entries:
            index = entry.get("index")
            path = entry.get("url") or entry.get("path")
            if not path or index is None:
                continue
            full_path = os.path.join('static/results', os.path.basename(path))
            img = cv2.imread(full_path)
            _, _, restored_img = gfpganer.enhance(img, has_aligned=False, only_center_face=True, paste_back=True)
            output_filename = f"restored_{uuid.uuid4().hex}.jpg"
            output_path = os.path.join('static/results', output_filename)
            cv2.imwrite(output_path, restored_img)
            metrics = compute_metrics(img, restored_img)
            restored_entries.append({
                "index": index,
                "url": f"/static/results/{output_filename}",
                "metrics": metrics
            })
        return jsonify({'restored_faces': restored_entries})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/merge_faces', methods=['POST'])
def merge_faces():
    try:
        data = request.get_json()
        original_path = data.get("original_image_path")
        if not original_path:
            return jsonify({'error': 'Missing original_image_path'}), 400
        full_path = os.path.join(original_path)
        img = cv2.imread(full_path)
        if img is None:
            return jsonify({'error': 'Original image not found'}), 404
        _, _, restored_img = gfpganer.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)
        merged_filename = f"merged_{uuid.uuid4().hex}.jpg"
        merged_path = os.path.join('static/results', merged_filename)
        cv2.imwrite(merged_path, restored_img)
        metrics = compute_metrics(img, restored_img)
        zip_filename = f"full_restored_image.zip"
        zip_path = os.path.join('static/zip', zip_filename)
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            zipf.write(merged_path, arcname="full_restored_image.jpg")
        return jsonify({
            "merged_image_url": f"/static/results/{merged_filename}",
            "metrics": metrics,
            "zip_url": f"/static/zip/{zip_filename}"
        })
    except Exception as e:
        print("[ERROR] Merge failed:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/download_zip', methods=['POST'])
def download_zip():
    try:
        data = request.get_json()
        face_entries = data.get('face_paths', [])
        zip_filename = f"faces_{uuid.uuid4().hex}.zip"
        zip_path = os.path.join("static/zip", zip_filename)
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for entry in face_entries:
                path = entry.get("url") or entry.get("path")
                index = entry.get("index")
                if not path or index is None:
                    continue
                full_path = os.path.join("static/results", os.path.basename(path))
                zipf.write(full_path, arcname=f"face{index}_restored.jpg")
        return jsonify({'zip_url': f"/static/zip/{zip_filename}"})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)
