import type { PropsWithChildren } from "hono/jsx";
import { useEffect, useState } from "hono/jsx";
import { useResponsive } from "../hooks/useResponsive";

type Device = {
  contactTags: string[];
  groupTags: string[];
  online: boolean;
  contactPosting: boolean;
  groupPosting: boolean;
  queueCount: number;
};

type DevicesMap = Record<string, Device>;

const Posting = () => {
  const { isMobile, isDesktop } = useResponsive();
  const [postingType, setPostingType] = useState<"contact" | "group">(
    "contact"
  );
  const [devices, setDevices] = useState<DevicesMap>({});
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sendAsContact, setSendAsContact] = useState(false);
  const [files, setFiles] = useState<{ file: File; caption: string }[]>([]);
  const [captionDialogIndex, setCaptionDialogIndex] = useState<number | null>(
    null
  );
  const [tempCaption, setTempCaption] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDevices = () => {
      fetch("/api/devices")
        .then((res) => res.json())
        .then((data) => setDevices(data));
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleDeviceToggle = (name: string) => {
    const dev = devices[name];
    if (!dev) return;

    setSelectedDevices((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const uniqueTags = Array.from(
    new Set(
      selectedDevices.flatMap((name) =>
        postingType === "contact"
          ? devices[name]?.contactTags || []
          : devices[name]?.groupTags || []
      )
    )
  );

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const maxSize = 25 * 1024 * 1024;

    if (input.files) {
      const newFiles = Array.from(input.files)
        .filter((f) => {
          if (f.size > maxSize) {
            alert(`File "${f.name}" exceeds the 25MB limit and was skipped.`);
            return false;
          }
          return true;
        })
        .map((f) => ({
          file: f,
          caption: "",
        }));

      setFiles((prev: { file: File; caption: string }[]) => [
        ...prev,
        ...newFiles,
      ]);
    }
  };

  const openCaptionDialog = (index: number) => {
    setTempCaption(files[index].caption || "");
    setCaptionDialogIndex(index);
    const dialog = document.getElementById(
      "caption-dialog"
    ) as HTMLDialogElement;
    dialog?.showModal();
  };

  const saveCaption = () => {
    if (captionDialogIndex !== null) {
      const updated = [...files];
      updated[captionDialogIndex].caption = tempCaption;
      setFiles(updated);
      setCaptionDialogIndex(null);
      const dialog = document.getElementById(
        "caption-dialog"
      ) as HTMLDialogElement;
      dialog?.close();
    }
  };

  const startPosting = async () => {
    if (!message && files.length === 0) {
      alert("Please enter a message or add at least one file.");
      return;
    }

    if (selectedDevices.length === 0) {
      alert("Please select at least one device.");
      return;
    }

    if (selectedTags.length === 0) {
      alert("Please select at least one tag.");
      return;
    }

    setLoading(true);
    try {
      const base64Files = await Promise.all(
        files.map(
          (f) =>
            new Promise<{ name: string; caption: string; base64: string }>(
              (resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () =>
                  resolve({
                    name: f.file.name,
                    caption: f.caption || "",
                    base64: (reader.result as string).split(",")[1],
                  });
                reader.onerror = reject;
                reader.readAsDataURL(f.file);
              }
            )
        )
      );

      const response = await fetch("/api/start-posting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message || "",
          sendAsContact,
          files: base64Files,
          selectedTags: selectedTags,
          selectedDevices: selectedDevices,
          postingType,
        }),
      });

      const result = await response.json();
      if (result.status === "ok") {
        alert("Posting started successfully!");
      } else {
        alert("Failed to start posting.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while starting posting.");
    } finally {
      setSelectedDevices([]);
      setSelectedTags([]);
      setLoading(false);
      fetch("/api/devices")
        .then((res) => res.json())
        .then((data) => setDevices(data));
    }
  };

  // Card component for consistent styling
  const Card = ({ children, title }: PropsWithChildren<{ title?: string }>) => (
    <div
      style={{
        backgroundColor: "#f9f9f9",
        padding: isDesktop ? "1.5rem" : "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        height: isDesktop ? "92%" : "200px",
        marginBottom: isDesktop ? "0" : "1rem",
      }}
    >
      {title && (
        <div style={{ marginBottom: "15px" }}>
          <strong>{title}</strong>
        </div>
      )}
      {children}
    </div>
  );

  return (
    <>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: "100%",
        }}
      >
        {/* Posting type + start button */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            marginTop: isMobile ? "10px" : "0",
            marginBottom: "20px",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? "10px" : "0",
          }}
        >
          <div style={{ display: "inline-flex" }}>
            <label
              style={{
                marginRight: "15px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <input
                type="radio"
                name="type"
                checked={postingType === "contact"}
                onChange={() => setPostingType("contact")}
                style={{ marginTop: "0" }}
              />
              <span>Contacts</span>
            </label>
            <label
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
            >
              <input
                type="radio"
                name="type"
                checked={postingType === "group"}
                onChange={() => setPostingType("group")}
                style={{ marginTop: "0" }}
              />
              <span>Groups</span>
            </label>
          </div>
          <button
            onClick={startPosting}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: loading ? "#6c757d" : "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              width: isMobile ? "100%" : "auto",
            }}
          >
            {loading ? "Posting..." : "Start Posting"}
          </button>
        </div>

        {/* Responsive layout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Mobile/Tablet: Show devices and tags first */}
          {!isDesktop && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Devices */}
              <Card title="Available Devices:">
                {Object.entries(devices).filter(([_, dev]) => dev.online)
                  .length === 0 ? (
                  <p
                    style={{
                      color: "#888",
                      textAlign: "center",
                      paddingTop: "0.5rem",
                      margin: "0",
                    }}
                  >
                    No devices available.
                  </p>
                ) : (
                  <label>
                    <input
                      type="checkbox"
                      checked={
                        selectedDevices.length ===
                        Object.entries(devices).filter(([_, dev]) => dev.online)
                          .length
                      }
                      onChange={(e) => {
                        const selectableDevices = Object.entries(devices)
                          .filter(([_, dev]) => dev.online)
                          .map(([name]) => name);

                        setSelectedDevices(
                          (e.target as HTMLInputElement).checked
                            ? selectableDevices
                            : []
                        );
                      }}
                    />{" "}
                    <strong>Select All</strong>
                  </label>
                )}
                <div
                  style={{
                    marginTop: "10px",
                    maxHeight: "150px",
                    overflowY: "auto",
                  }}
                >
                  {Object.entries(devices)
                    .filter(([_, dev]) => dev.online)
                    .map(([name, dev]) => {
                      const isPosting = dev.contactPosting || dev.groupPosting;
                      const queueCount = dev.queueCount || 0;
                      return (
                        <div key={name} style={{ marginTop: "5px" }}>
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedDevices.includes(name)}
                              onChange={() => handleDeviceToggle(name)}
                            />{" "}
                            {name} {isPosting && <span>(posting)</span>}{" "}
                            {queueCount > 0 && (
                              <span> ({queueCount} queued)</span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                </div>
              </Card>

              {/* Tags */}
              <Card title="Available Tags:">
                <div
                  style={{
                    maxHeight: "150px",
                    overflowY: "auto",
                  }}
                >
                  {uniqueTags.length === 0 && (
                    <p style={{ color: "#888", textAlign: "center" }}>
                      No tags available.
                    </p>
                  )}
                  {uniqueTags.map((tag) => (
                    <div key={tag} style={{ marginBottom: "5px" }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() =>
                            setSelectedTags((prev) =>
                              prev.includes(tag)
                                ? prev.filter((t) => t !== tag)
                                : [...prev, tag]
                            )
                          }
                        />{" "}
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Desktop layout */}
          {isDesktop && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "20px",
                height: "calc(100vh - 180px)",
              }}
            >
              {/* Message + Files - takes 2 columns */}
              <div style={{ gridColumn: "span 2" }}>
                <div
                  style={{
                    backgroundColor: "#f9f9f9",
                    padding: "1.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    height: "92%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label>
                      <strong>Message:</strong>
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="checkbox"
                        id="sendAsContact"
                        checked={sendAsContact}
                        onClick={(e) => {
                          const target = e.target as HTMLInputElement | null;
                          if (target) {
                            setSendAsContact(target.checked);
                          }
                        }}
                        style={{ zoom: "1.2" }}
                      />
                      <label htmlFor="sendAsContact">Send as Contacts</label>
                    </div>
                  </div>
                  <textarea
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => {
                      if (e.target) {
                        setMessage((e.target as HTMLTextAreaElement).value);
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "200px",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      resize: "vertical",
                      marginTop: "8px",
                      outlineColor: "#aaa",
                      fontFamily: "inherit",
                      backgroundColor: "inherit",
                    }}
                  />
                  <div
                    style={{
                      marginTop: "15px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label>
                      <strong>Files:</strong>
                    </label>
                    <div>
                      <label
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "#007bff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13.5px",
                        }}
                      >
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          style={{
                            display: "none",
                          }}
                        />
                        Add Files
                      </label>
                      <button
                        onClick={() => setFiles([])}
                        style={{
                          marginLeft: "10px",
                          padding: "6px 10px",
                          backgroundColor: "red",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Clear Files
                      </button>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <div
                      style={{
                        padding: "12px 0",
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}
                    >
                      {files.map((f, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "10px",
                            backgroundColor: "#fff",
                            padding: "10px",
                            borderRadius: "6px",
                            boxShadow: "0 0 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          <span style={{ flex: "1", fontWeight: "bold" }}>
                            {f.file.name}
                          </span>
                          <button
                            onClick={() => openCaptionDialog(idx)}
                            style={{
                              marginLeft: "10px",
                              padding: "6px 10px",
                              backgroundColor: "#007bff",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            {f.caption ? "Edit Caption" : "Add Caption"}
                          </button>
                          <button
                            onClick={() => {
                              const updated = [...files];
                              updated.splice(idx, 1);
                              setFiles(updated);
                            }}
                            style={{
                              marginLeft: "10px",
                              padding: "6px 10px",
                              backgroundColor: "red",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Devices */}
              <Card title="Available Devices:">
                {Object.entries(devices).filter(([_, dev]) => dev.online)
                  .length === 0 ? (
                  <p
                    style={{
                      color: "#888",
                      textAlign: "center",
                      paddingTop: "1rem",
                      margin: "0",
                    }}
                  >
                    No devices available.
                  </p>
                ) : (
                  <label>
                    <input
                      type="checkbox"
                      checked={
                        selectedDevices.length ===
                        Object.entries(devices).filter(([_, dev]) => dev.online)
                          .length
                      }
                      onChange={(e) => {
                        const selectableDevices = Object.entries(devices)
                          .filter(([_, dev]) => dev.online)
                          .map(([name]) => name);

                        setSelectedDevices(
                          (e.target as HTMLInputElement).checked
                            ? selectableDevices
                            : []
                        );
                      }}
                    />{" "}
                    <strong>Select All</strong>
                  </label>
                )}
                <div
                  style={{
                    marginTop: "10px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {Object.entries(devices)
                    .filter(([_, dev]) => dev.online)
                    .map(([name, dev]) => {
                      const isPosting = dev.contactPosting || dev.groupPosting;
                      const queueCount = dev.queueCount || 0;
                      return (
                        <div key={name} style={{ marginTop: "5px" }}>
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedDevices.includes(name)}
                              onChange={() => handleDeviceToggle(name)}
                            />{" "}
                            {name} {isPosting && <span>(posting)</span>}{" "}
                            {queueCount > 0 && (
                              <span> ({queueCount} queued)</span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                </div>
              </Card>

              {/* Tags */}
              <Card title="Available Tags:">
                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {uniqueTags.length === 0 && (
                    <p style={{ color: "#888", textAlign: "center" }}>
                      No tags available.
                    </p>
                  )}
                  {uniqueTags.map((tag) => (
                    <div key={tag} style={{ marginBottom: "5px" }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() =>
                            setSelectedTags((prev) =>
                              prev.includes(tag)
                                ? prev.filter((t) => t !== tag)
                                : [...prev, tag]
                            )
                          }
                        />{" "}
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Mobile/Tablet: Message section below devices and tags */}
          {!isDesktop && (
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "1rem",
                border: "1px solid #ccc",
                borderRadius: "8px",
                height: "fit-content",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <label>
                  <strong>Message:</strong>
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    id="sendAsContact"
                    checked={sendAsContact}
                    onClick={(e) => {
                      const target = e.target as HTMLInputElement | null;
                      if (target) {
                        setSendAsContact(target.checked);
                      }
                    }}
                    style={{ zoom: "1.2" }}
                  />
                  <label htmlFor="sendAsContact">Send as Contacts</label>
                </div>
              </div>
              <textarea
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => {
                  if (e.target) {
                    setMessage((e.target as HTMLTextAreaElement).value);
                  }
                }}
                style={{
                  width: "100%",
                  height: "150px",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  resize: "vertical",
                  marginTop: "8px",
                  outlineColor: "#aaa",
                  fontFamily: "inherit",
                  backgroundColor: "inherit",
                }}
              />
              <div
                style={{
                  marginTop: "15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <label>
                  <strong>Files:</strong>
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <label
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#007bff",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13.5px",
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      style={{
                        display: "none",
                      }}
                    />
                    Add Files
                  </label>
                  <button
                    onClick={() => setFiles([])}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "red",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Clear Files
                  </button>
                </div>
              </div>
              {files.length > 0 && (
                <div
                  style={{
                    padding: "12px 0",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: isMobile ? "block" : "flex",
                        alignItems: "center",
                        marginBottom: "10px",
                        backgroundColor: "#fff",
                        padding: "10px",
                        borderRadius: "6px",
                        boxShadow: "0 0 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <span
                        style={{
                          flex: "1",
                          fontWeight: "bold",
                          marginBottom: isMobile ? "8px" : "0",
                          display: "block",
                        }}
                      >
                        {f.file.name}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                        }}
                      >
                        <button
                          onClick={() => openCaptionDialog(idx)}
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "#007bff",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          {f.caption ? "Edit Caption" : "Add Caption"}
                        </button>
                        <button
                          onClick={() => {
                            const updated = [...files];
                            updated.splice(idx, 1);
                            setFiles(updated);
                          }}
                          style={{
                            padding: "6px 10px",
                            backgroundColor: "red",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Caption Dialog */}
      <dialog
        id="caption-dialog"
        style={{
          padding: "20px",
          borderWidth: "2px",
          borderRadius: "8px",
          borderColor: "#ccc",
          width: isMobile ? "90%" : "350px",
          maxWidth: "100%",
        }}
      >
        <form
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault();
            saveCaption();
          }}
          style={{
            margin: "0",
          }}
        >
          <label>
            <strong>Enter Caption:</strong>
          </label>
          <br />
          <textarea
            value={tempCaption}
            onChange={(e) => {
              if (e.target) {
                setTempCaption((e.target as HTMLTextAreaElement).value);
              }
            }}
            style={{
              width: "100%",
              height: "120px",
              marginTop: "10px",
              marginBottom: "15px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              outlineColor: "#aaa",
              fontFamily: "inherit",
              backgroundColor: "inherit",
            }}
          />
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
          >
            <button
              type="submit"
              style={{
                padding: "6px 12px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                const dialog = document.getElementById(
                  "caption-dialog"
                ) as HTMLDialogElement;
                dialog?.close();
                setCaptionDialogIndex(null);
              }}
              style={{
                padding: "6px 12px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
};

export default Posting;
