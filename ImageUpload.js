import React, { useState } from 'react';
import axios from 'axios';
import './ImageUpload.css';

const ImageUpload = () => {
  const [image, setImage] = useState(null);
  const [restoredImage, setRestoredImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setRestoredImage(null);
    setErrorMsg('');
  };

  const handleUpload = async () => {
    if (!image) {
      setErrorMsg('Please select an image first.');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/upload', formData);
      const filename = res.data.filename;
      setRestoredImage(`http://localhost:5000/result/${filename}`);
    } catch (err) {
      setErrorMsg('Failed to restore image. Try a different one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1>Image Restoration</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Restoring...' : 'Upload & Restore'}
      </button>

      {errorMsg && <p className="error">{errorMsg}</p>}

      {restoredImage && (
        <div className="result">
          <h3>Restored Image:</h3>
          <img src={restoredImage} alt="Restored" />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
