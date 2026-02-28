import "./Sidebar.css";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import type { SimMetadata } from "@tarang-and-tina/shared/dist/domain";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/Auth.ts";
import { useSim } from "../../contexts/Sim";
import { setMfaRequest } from "../../api/auth";
import MfaSetup from "../../components/MfaSetup.tsx";

export default function Sidebar({
  setMessage,
}: {
  setMessage: Dispatch<SetStateAction<string>>;
}) {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const {
    simId,
    simMetadata,
    simMetadataList,
    simWorker,
    updateSim,
    setSim,
    createSim,
    deleteSim,
  } = useSim();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const [mfaEnabled, setMfaEnabled] = useState(user ? user.mfaEnabled : false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaVisible, setMfaVisible] = useState(false);

  const [localMetadata, setLocalMetadata] = useState<Partial<SimMetadata>>({
    description: "",
    gravity: -12.0,
    targetDensity: 75.0,
    pressureMultiplier: 500.0,
    viscosityStrength: 0.03,
    smoothingRadius: 0.35,
    interactionStrength: 90.0,
    interactionRadius: 2.0,
  });

  useEffect(() => {
    if (!simMetadata) return;
    setLocalMetadata((prevMetadata) => ({
      ...prevMetadata,
      description: simMetadata.description,
    }));
  }, [simMetadata]);

  const handleSetMfa = async (enabled: boolean) => {
    setMfaLoading(true);
    try {
      const response = await setMfaRequest(enabled);
      // Don't update state here since we already set it in onChange
      setMessage(
        response.mfaEnabled
          ? "Two-factor authentication enabled successfully"
          : "Two-factor authentication disabled successfully",
      );
    } catch (err: unknown) {
      setMessage(`Failed to toggle MFA: ${String(err)}`);
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className={`sidebar-container ${visible ? "visible" : "hidden"}`}>
      <div className="sidebar">
        <h2>Welcome!</h2>
        <div className="logout">
          <span
            onClick={(e) => {
              e.preventDefault();
              logout()
                .then(() => {
                  void navigate("/");
                })
                .catch((err: unknown) => {
                  setMessage(String(err));
                });
            }}
          >
            Logout
          </span>
        </div>

        <div className="divider" />

        <h3>Security Settings</h3>
        <div className="mfa-toggle">
          <div className="mfa-toggle-content">
            <span className="mfa-label">
              Two-Factor Authentication
              {user?.federated ? " Disallowed due to Federated Login" : ""}
            </span>
            <div className="mfa-switch">
              <input
                type="checkbox"
                id="mfa-toggle"
                checked={mfaEnabled}
                disabled={mfaLoading || user?.federated}
                onChange={(e) => {
                  if (mfaLoading) return;

                  const newMfaEnabled = e.target.checked;
                  const wasEnabled = mfaEnabled;

                  // Update the visual state immediately
                  setMfaEnabled(newMfaEnabled);

                  if (newMfaEnabled && !wasEnabled) {
                    // User wants to enable MFA - start setup process
                    setMfaVisible(true);
                  } else if (!newMfaEnabled && wasEnabled) {
                    // User wants to disable MFA - direct toggle
                    void handleSetMfa(false);
                  }
                }}
              />
              <label htmlFor="mfa-toggle" className="mfa-switch-label">
                <span className="mfa-switch-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="divider" />

        <h3>Simulation Settings</h3>

        <div className="simulation-settings">
          <div className="input-numeric">
            <label htmlFor="gravity">Gravity</label>
            <input
              type="number"
              min={-20.0}
              max={20.0}
              step={0.1}
              name="gravity"
              value={localMetadata.gravity}
              onChange={(e) => {
                e.preventDefault();
                const gravity = parseFloat(e.currentTarget.value);
                if (isNaN(gravity)) return;
                setLocalMetadata({
                  ...localMetadata,
                  gravity,
                });
                simWorker?.postMessage({
                  type: "UPDATE_PARAMETER",
                  payload: { parameter: "gravity", gravity },
                });
              }}
            />
          </div>
          <div className="input-numeric">
            <label htmlFor="targetDensity">Target Density</label>
            <input
              type="number"
              min={0.0}
              max={500.0}
              step={0.1}
              name="targetDensity"
              value={localMetadata.targetDensity}
              onChange={(e) => {
                e.preventDefault();
                const targetDensity = parseFloat(e.currentTarget.value);
                if (isNaN(targetDensity)) return;
                setLocalMetadata({
                  ...localMetadata,
                  targetDensity,
                });
                simWorker?.postMessage({
                  type: "UPDATE_PARAMETER",
                  payload: { parameter: "targetDensity", targetDensity },
                });
              }}
            />
          </div>
          <div className="input-numeric">
            <label htmlFor="pressureMultiplier">Pressure Multiplier</label>
            <input
              type="number"
              min={0.0}
              max={500.0}
              step={0.1}
              name="pressureMultiplier"
              value={localMetadata.pressureMultiplier}
              onChange={(e) => {
                e.preventDefault();
                const pressureMultiplier = parseFloat(e.currentTarget.value);
                if (isNaN(pressureMultiplier)) return;
                setLocalMetadata({
                  ...localMetadata,
                  pressureMultiplier,
                });
                simWorker?.postMessage({
                  type: "UPDATE_PARAMETER",
                  payload: {
                    parameter: "pressureMultiplier",
                    pressureMultiplier,
                  },
                });
              }}
            />
          </div>
          <div className="input-numeric">
            <label htmlFor="viscosityStrength">Viscosity Strength</label>
            <input
              type="number"
              min={0.0}
              max={2.0}
              step={0.001}
              name="viscosityStrength"
              value={localMetadata.viscosityStrength}
              onChange={(e) => {
                e.preventDefault();
                const viscosityStrength = parseFloat(e.currentTarget.value);
                if (isNaN(viscosityStrength)) return;
                setLocalMetadata({
                  ...localMetadata,
                  viscosityStrength,
                });
                simWorker?.postMessage({
                  type: "UPDATE_PARAMETER",
                  payload: {
                    parameter: "viscosityStrength",
                    viscosityStrength,
                  },
                });
              }}
            />
          </div>
          <div className="input-numeric">
            <label htmlFor="smoothingRadius">Smoothing Radius</label>
            <input
              type="number"
              min={0.0}
              max={5.0}
              step={0.01}
              name="smoothingRadius"
              value={localMetadata.smoothingRadius}
              onChange={(e) => {
                e.preventDefault();
                const smoothingRadius = parseFloat(e.currentTarget.value);
                if (isNaN(smoothingRadius)) return;
                setLocalMetadata({
                  ...localMetadata,
                  smoothingRadius,
                });
                simWorker?.postMessage({
                  type: "UPDATE_PARAMETER",
                  payload: {
                    parameter: "smoothingRadius",
                    smoothingRadius,
                  },
                });
              }}
            />
          </div>
          <div className="input-numeric">
            <label htmlFor="interactionStrength">Interaction Strength</label>
            <input
              type="number"
              min={0.0}
              max={200.0}
              step={0.1}
              name="interactionStrength"
              value={localMetadata.interactionStrength}
              onChange={(e) => {
                e.preventDefault();
                const interactionStrength = parseFloat(e.currentTarget.value);
                if (isNaN(interactionStrength)) return;
                setLocalMetadata({
                  ...localMetadata,
                  interactionStrength,
                });
                simWorker?.postMessage({
                  type: "UPDATE_PARAMETER",
                  payload: {
                    parameter: "interactionStrength",
                    interactionStrength,
                  },
                });
              }}
            />
          </div>
          <div className="input-numeric">
            <label htmlFor="interactionRadius">Interaction Radius</label>
            <input
              type="number"
              min={0.0}
              max={5.0}
              step={0.1}
              name="interactionRadius"
              value={localMetadata.interactionRadius}
              onChange={(e) => {
                e.preventDefault();
                const interactionRadius = parseFloat(e.currentTarget.value);
                if (isNaN(interactionRadius)) return;
                setLocalMetadata({
                  ...localMetadata,
                  interactionRadius,
                });
                simWorker?.postMessage({
                  type: "UPDATE_PARAMETER",
                  payload: {
                    parameter: "interactionRadius",
                    interactionRadius,
                  },
                });
              }}
            />
          </div>
          {simMetadata ? (
            <div className="button-with-text">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();

                  if (!simId) return;
                  const newMetadata = {
                    ...simMetadata,
                    description: localMetadata.description,
                    gravity: localMetadata.gravity,
                    targetDensity: localMetadata.targetDensity,
                    pressureMultiplier: localMetadata.pressureMultiplier,
                    viscosityStrength: localMetadata.viscosityStrength,
                    smoothingRadius: localMetadata.smoothingRadius,
                    interactionStrength: localMetadata.interactionStrength,
                    interactionRadius: localMetadata.interactionRadius,
                  };
                  void updateSim(simId, newMetadata);
                }}
              >
                Save
              </button>
            </div>
          ) : null}
        </div>

        <div className="divider" />
        <h3>Simulations</h3>
        <div className="simulations">
          {simMetadataList.length === 0 ? (
            <div>No simulations found</div>
          ) : (
            simMetadataList.map((metadata, i) => (
              <div className="simulation" key={metadata.id}>
                <div className="simulation-description">
                  <input
                    disabled={selectedIndex !== i}
                    value={
                      selectedIndex === i
                        ? localMetadata.description
                        : metadata.description
                    }
                    onChange={(e) => {
                      const description = e.target.value;
                      setLocalMetadata({
                        ...localMetadata,
                        description,
                      });
                    }}
                  />
                </div>
                <div className="button small">
                  <button
                    disabled={selectedIndex !== i}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const partial = {
                        description: localMetadata.description,
                      };
                      updateSim(metadata.id, partial).catch((err: unknown) => {
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
                        d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                      />
                    </svg>
                  </button>
                </div>
                <div className="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIndex === i}
                    onChange={() => {
                      setSim(i);
                      setSelectedIndex(i);
                      setLocalMetadata({
                        ...metadata,
                      });
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
                <div className="button-with-text small simulation-delete">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();

                      deleteSim(metadata.id).catch((err: unknown) => {
                        setMessage(String(err));
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="button-with-text">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();

              createSim().catch((err: unknown) => {
                setMessage(String(err));
              });
            }}
          >
            Create
          </button>
        </div>
      </div>
      <div
        className={`close-button-2 ${visible ? "visible" : "hidden"}`}
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
                : "M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
            }
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={visible ? "" : "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"}
          />
        </svg>
      </div>

      {/* MFA Setup Popup Modal */}
      {mfaVisible ? (
        <MfaSetup
          onClose={() => {
            setMfaEnabled(false);
            setMfaVisible(false);
          }}
          onSuccess={async () => {
            await handleSetMfa(true);
            setMfaVisible(false);
          }}
          onError={(error: string) => {
            setMessage(error);
          }}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
