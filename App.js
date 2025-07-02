import React, { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [originalImagePath, setOriginalImagePath] = useState("");
  const [faces, setFaces] = useState([]);
  const [selectedFaces, setSelectedFaces] = useState([]);
  const [restoredFaces, setRestoredFaces] = useState([]);
  const [downloadChecks, setDownloadChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState({ selected: false, all: false });
  const [downloadSelected, setDownloadSelected] = useState(false);
  const [downloadAll, setDownloadAll] = useState(false);
  const [bestFace, setBestFace] = useState(null);
  const [worstFace, setWorstFace] = useState(null);
  const [mergedImage, setMergedImage] = useState(null);
  const [mergedMetrics, setMergedMetrics] = useState(null);
  const [merging, setMerging] = useState(false);
  const [mergedDone, setMergedDone] = useState(false);
  const [mergedZipUrl, setMergedZipUrl] = useState(null);

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setOriginalImageUrl(URL.createObjectURL(selectedFile));
    setFaces([]);
    setSelectedFaces([]);
    setRestoredFaces([]);
    setDownloadChecks([]);
    setBestFace(null);
    setWorstFace(null);
    setMergedImage(null);
    setMergedMetrics(null);
    setMergedDone(false);
    setMergedZipUrl(null);
  };

  const handleDetectFaces = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("http://localhost:5000/detect_faces", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (Array.isArray(data.faces)) {
        setFaces(data.faces);
        setOriginalImagePath(data.original_image_path);
        setSelectedFaces([]);
        setRestoredFaces([]);
        setDownloadChecks([]);
        setBestFace(null);
        setWorstFace(null);
        setMergedImage(null);
        setMergedMetrics(null);
        setMergedDone(false);
        setMergedZipUrl(null);
      } else {
        alert("Face detection failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Face detection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFace = (index) => {
    setSelectedFaces((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const restoreFaces = async (mode) => {
    const selection =
      mode === "all"
        ? faces
        : faces.filter((f) => selectedFaces.includes(f.index));

    if (selection.length === 0) {
      alert("Select at least one face to restore.");
      return;
    }

    setRestoring((prev) => ({ ...prev, [mode]: true }));

    try {
      const res = await fetch("http://localhost:5000/restore_faces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ face_paths: selection }),
      });
      const data = await res.json();
      if (Array.isArray(data.restored_faces)) {
        const withScores = data.restored_faces.map((f) => {
          const psnr = f.metrics?.psnr || 0;
          const ssim = f.metrics?.ssim || 0;
          const lpips = f.metrics?.lpips || 0;
          const score = psnr + ssim * 100 - lpips * 100;
          return { ...f, score };
        });

        const sorted = [...withScores].sort((a, b) => b.score - a.score);
        setBestFace(sorted[0]?.index);
        setWorstFace(sorted[sorted.length - 1]?.index);
        setRestoredFaces(withScores);
        setDownloadChecks(new Array(withScores.length).fill(false));
        setMergedImage(null);
        setMergedMetrics(null);
        setMergedDone(false);
        setMergedZipUrl(null);
      } else {
        alert("Restoration failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Restoration failed.");
    } finally {
      setRestoring((prev) => ({ ...prev, [mode]: false }));
    }
  };

  const handleDownloadToggle = (idx) => {
    const updated = [...downloadChecks];
    updated[idx] = !updated[idx];
    setDownloadChecks(updated);
  };

  const handleDownload = async (mode) => {
    const selection =
      mode === "all"
        ? restoredFaces
        : restoredFaces.filter((_, i) => downloadChecks[i]);

    if (selection.length === 0) {
      alert("Select at least one face to download.");
      return;
    }

    mode === "all" ? setDownloadAll(true) : setDownloadSelected(true);

    try {
      const res = await fetch("http://localhost:5000/download_zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ face_paths: selection }),
      });
      const data = await res.json();
      if (data.zip_url) {
        const a = document.createElement("a");
        a.href = `http://localhost:5000${data.zip_url}`;
        a.download = "restored_faces.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("Download failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Download failed.");
    } finally {
      setDownloadSelected(false);
      setDownloadAll(false);
    }
  };

  const handleMergeFaces = async () => {
    if (!originalImagePath) {
      alert("Original image path missing.");
      return;
    }

    setMerging(true);
    setMergedImage(null);
    setMergedMetrics(null);

    try {
      const res = await fetch("http://localhost:5000/merge_faces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_image_path: originalImagePath }),
      });

      const data = await res.json();
      if (data.merged_image_url) {
        setMergedImage(`http://localhost:5000${data.merged_image_url}`);
        setMergedMetrics(data.metrics || {});
        setMergedDone(true);
        setMergedZipUrl(`http://localhost:5000${data.zip_url}`);
      } else {
        alert("Merging failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Merging failed.");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="page-container">
      <div className="overlay">
        <div className="app">
          <h1 className="main-heading">AI Photo Enhancement & Restoration Tool</h1>
          <h2 className="sub-heading">
            Detect faces, restore details, and enhance quality - instantly.
          </h2>

          <form className="upload-form">
            <label className="file-input-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleChange}
              />
              Choose File
            </label>
            <button
              className="upload-btn"
              onClick={handleDetectFaces}
              disabled={!file || loading}
            >
              {loading ? "Detecting Faces..." : "Detect Faces"}
            </button>
          </form>

          {originalImageUrl && (
            <div className="image-comparison-wrapper">
              <div className="image-box">
                <h3>Original Image</h3>
                <img
                  src={originalImageUrl}
                  alt="Original"
                />
              </div>
            </div>
          )}

          {/* Detected Faces Section */}
          {faces.length > 0 && restoredFaces.length === 0 && (
            <div className="image-comparison-wrapper">
              <h2 style={{ color: "white" }}>Detected Faces</h2>
              <div className="image-comparison">
                {faces.map((f) => (
                  <div
                    key={f.index}
                    className="image-box"
                  >
                    <h3>Face {f.index}</h3>
                    <img
                      src={`http://localhost:5000${f.url}`}
                      alt={`Face ${f.index}`}
                    />
                    <div>
                      <input
                        type="checkbox"
                        id={`face-${f.index}`}
                        checked={selectedFaces.includes(f.index)}
                        onChange={() => handleSelectFace(f.index)}
                      />
                      <label
                        htmlFor={`face-${f.index}`}
                        className="checkbox-label"
                      >
                        Select
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="download-container">
                <button
                  className="upload-btn"
                  onClick={() => restoreFaces("selected")}
                  disabled={restoring.selected}
                >
                  {restoring.selected ? "Restoring..." : "Restore Selected"}
                </button>
                <button
                  className="upload-btn"
                  onClick={() => restoreFaces("all")}
                  disabled={restoring.all}
                >
                  {restoring.all ? "Restoring..." : "Restore All"}
                </button>
              </div>
            </div>
          )}

          {/* Restored Faces Section */}
          {restoredFaces.length > 0 && (
            <div className="image-comparison-wrapper">
              <h2 style={{ color: "white" }}>Restored Faces & Metrics</h2>
              <div className="face-comparisons">
                {restoredFaces.map((f, idx) => {
                  const orig = faces.find((o) => o.index === f.index);
                  const isBest = f.index === bestFace;
                  const isWorst = f.index === worstFace;

                  return (
                    <div
                      key={f.index}
                      className={`face-comparison ${
                        restoredFaces.length > 1
                          ? isBest
                            ? "best-face"
                            : isWorst
                            ? "worst-face"
                            : ""
                          : ""
                      }`}
                    >
                      <div className="image-box">
                        <h3>Face {f.index} (Original)</h3>
                        
                        <img
                          src={`http://localhost:5000${orig.url}`}
                          alt={`Orig ${f.index}`}
                        />
                        <div className="tags-row">
                          {restoredFaces.length === 1 && (
                            <span className="tag single">
                              Only One Face Restored
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="tags-row">
                              {restoredFaces.length > 1 && (
                                <>
                                  {isBest && (
                                    <span className="tag best"> BEST</span>
                                  )}
                                  {isWorst && (
                                    <span className="tag worst"> WORST</span>
                                  )}
                                </>
                              )}
                            </div>

                      <div className="image-box">
                        <h3>Face {f.index} (Restored)</h3>
                        <img
                          src={`http://localhost:5000${f.url}`}
                          alt={`Res ${f.index}`}
                        />
                        {f.metrics && (
                          <div className="metrics-with-tags">
                            <div className="metrics">
                              <p title="Higher sharpness means the image has more clarity.">
                                🟢 Sharpness(~30 to 40+ dB): {f.metrics.psnr?.toFixed(2)} dB
                              </p>
                              <p title="Closer to 1 means more similar to original.">
                                🔵 Structural Similarity(&gt;0.85): {f.metrics.ssim?.toFixed(4)}
                              </p>
                              <p title="Lower confidence score means more realistic.">
                                🟡 Restoration Quality(&lt;0.30): {f.metrics.lpips?.toFixed(4)}
                              </p>
                            </div>
                            {/* <div className="tags-row">
                              {restoredFaces.length > 1 && (
                                <>
                                  {isBest && (
                                    <span className="tag best"> BEST</span>
                                  )}
                                  {isWorst && (
                                    <span className="tag worst"> WORST</span>
                                  )}
                                </>
                              )}
                            </div> */}
                          </div>
                        )}
                        <div>
                          <input
                            type="checkbox"
                            id={`download-${f.index}`}
                            checked={downloadChecks[idx] || false}
                            onChange={() => handleDownloadToggle(idx)}
                          />
                          <label
                            htmlFor={`download-${f.index}`}
                            className="checkbox-label"
                          >
                            Download
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="download-container">
                <button
                  className="upload-btn"
                  onClick={() => handleDownload("selected")}
                  disabled={downloadSelected}
                >
                  {downloadSelected ? "Downloading..." : "Download Selected"}
                </button>
                <button
                  className="upload-btn"
                  onClick={() => handleDownload("all")}
                  disabled={downloadAll}
                >
                  {downloadAll ? "Downloading..." : "Download All"}
                </button>
                {!mergedDone && (
                  <button
                    className="upload-btn"
                    onClick={handleMergeFaces}
                    disabled={merging}
                  >
                    {merging ? "Merging..." : "Merge Restored Faces"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Final Merged Image Comparison */}
          {mergedImage && (
            <div className="image-comparison-wrapper large-compare">
              <h2 style={{ color: "white" }}>
                Merged Full Image (All Faces Restored)
              </h2>
              <div className="image-comparison">
                <div className="image-box large">
                  <h3>Original Image</h3>
                  <img
                    src={originalImageUrl}
                    alt="Original Full"
                    className="large-img"
                  />
                </div>
                <div className="image-box large">
                  <h3>Restored Full Image</h3>
                  <img
                    src={mergedImage}
                    alt="Restored Full"
                    className="large-img"
                  />
                  {mergedMetrics && (
                    <div className="metrics">
                      <p title="Higher Sharpness means the image has more clarity.">🟢 Sharpness(~30 to 40+ dB): {mergedMetrics.psnr?.toFixed(2)} dB</p>
                      <p title="Closer to 1 means more similar to original.">🔵 Structural Similarity(&gt;0.85): {mergedMetrics.ssim?.toFixed(4)}</p>
                      <p title="Lower confidence score means more realistic.">
                        🟡 Restoration Quality(&lt;0.30):{" "}
                        {mergedMetrics.lpips !== undefined
                          ? mergedMetrics.lpips.toFixed(4)
                          : "N/A"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {mergedZipUrl && (
                <div
                  className="download-container"
                  style={{ textAlign: "center", marginTop: 25 }}
                >
                  <a
                    className="upload-btn"
                    href={mergedZipUrl}
                    download="full_restored_image.zip"
                  >
                     Download Full Restored Image
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        <footer className="footer">
          Created by <span className="creator">Sanjilka Saxena</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
