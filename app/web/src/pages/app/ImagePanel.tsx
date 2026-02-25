import { downloadSimImageRequest } from "../../api/sim";
import { useSim } from "../../contexts/Sim";
import "./ImagePanel.css";

import { useState, type Dispatch, type SetStateAction } from "react";

export default function ImagePanel({
  setMessage,
}: {
  setMessage: Dispatch<SetStateAction<string>>;
}) {
  const {
    simId,
    recordings,
    selectedRecording,
    recordingsNextToken,
    images,
    imagesNextToken,
    imagesLoading,
    setRecording,
    deleteSimImage,
    refreshRecordings,
    listMoreRecordings,
    refreshImages,
    listMoreImages,
  } = useSim();

  const [visible, setVisible] = useState(false);

  return (
    <div className={`images-panel-container ${visible ? "visible" : "hidden"}`}>
      <div className="images-panel">
        <h2>Recordings</h2>

        {recordings.length === 0 ? (
          <p>No recordings available.</p>
        ) : !simId ? (
          <p>No recordings yet</p>
        ) : (
          <div>
            {recordings.map((recording, i) => (
              <div className="recording" key={recording.timestamp}>
                <div>{recording.timestamp}</div>
                <div className="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRecording === recordings[i]}
                    onChange={() => {
                      setRecording(i);
                    }}
                  />
                  <div className="checkmark">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                    >
                      <path d="M20.8,3l3.2,3.2-14.8,14.8L0,11.9l3.2-3.2,6,6L20.8,3Z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pagination">
          {recordingsNextToken && (
            <div className="button-with-text">
              <button
                type="button"
                onClick={() => {
                  listMoreRecordings().catch((err: unknown) => {
                    setMessage(String(err));
                  });
                }}
              >
                Load more
              </button>
            </div>
          )}
          {recordings.length > 0 && !recordingsNextToken && (
            <span>End of recordings</span>
          )}
        </div>

        <div className="button-with-text">
          <button
            type="button"
            onClick={() => {
              refreshRecordings();
            }}
          >
            Refresh Recordings
          </button>
        </div>

        <h2>Images</h2>

        {!selectedRecording ? (
          <p>No recording selected.</p>
        ) : images.length === 0 ? (
          <p>No images available.</p>
        ) : imagesLoading || !simId ? (
          <p>No images yet</p>
        ) : (
          <div className="images">
            {images.map((img) => (
              <div key={img.filename} className="image">
                <div
                  className="image-download"
                  onClick={() => {
                    downloadSimImageRequest(
                      simId,
                      selectedRecording.timestamp,
                      img.filename,
                    )
                      .then((data) => {
                        window.open(
                          data.downloadUrl,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      })
                      .catch((err: unknown) => {
                        setMessage(String(err));
                      });
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                </div>
                <div className="image-filename">
                  {img.filename
                    .slice(-9)
                    .replace(/\.png/, "")
                    .replace(/(\d+)/, "Frame $1")}
                </div>
                <div className="button-with-text image-delete">
                  <button
                    type="button"
                    onClick={() => {
                      deleteSimImage(
                        simId,
                        selectedRecording.timestamp,
                        img.filename,
                      ).catch((err: unknown) => {
                        setMessage(String(err));
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pagination">
          {!imagesLoading && imagesNextToken && (
            <div className="button-with-text">
              <button
                type="button"
                onClick={() => {
                  listMoreImages().catch((err: unknown) => {
                    setMessage(String(err));
                  });
                }}
              >
                Load more
              </button>
            </div>
          )}
          {images.length > 0 && !imagesNextToken && <span>End of images</span>}
        </div>

        <div className="button-with-text">
          <button
            type="button"
            onClick={() => {
              if (selectedRecording) {
                refreshImages(selectedRecording);
              }
            }}
          >
            Refresh Images
          </button>
        </div>
      </div>

      <div
        className={`close-button-1 ${visible ? "visible" : "hidden"}`}
        onClick={() => {
          setVisible(!visible);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="#222222"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={
              visible
                ? "M6 18 18 6M6 6l12 12"
                : "m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            }
          />
        </svg>
      </div>
    </div>
  );
}
