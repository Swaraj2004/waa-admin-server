import { useEffect, useState } from "hono/jsx";

type Device = {
  contactTags: string[];
  groupTags: string[];
  online: boolean;
  contactPosting: boolean;
  groupPosting: boolean;
};

type DevicesMap = Record<string, Device>;

const Posting = () => {
  const [postingType, setPostingType] = useState<"contacts" | "groups">(
    "contacts"
  );
  const [devices, setDevices] = useState<DevicesMap>({});
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
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
    if (!dev || dev.contactsPosting || dev.groupsPosting) return;

    setSelectedDevices((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const uniqueTags = Array.from(
    new Set(
      selectedDevices.flatMap((name) =>
        postingType === "contacts"
          ? devices[name]?.contactTags || []
          : devices[name]?.groupTags || []
      )
    )
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxSize = 10 * 1024 * 1024;

    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
        .filter((f) => {
          if (f.size > maxSize) {
            alert(`File "${f.name}" exceeds the 10MB limit and was skipped.`);
            return false;
          }
          return true;
        })
        .map((f) => ({
          file: f,
          caption: "",
        }));

      setFiles((prev) => [...prev, ...newFiles]);
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
          files: base64Files,
          selectedTags: selectedTags || [],
          selectedDevices: selectedDevices || [],
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

  return (
    <>
      <div style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Posting type + start button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
            alignItems: "center",
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
                checked={postingType === "contacts"}
                onChange={() => setPostingType("contacts")}
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
                checked={postingType === "groups"}
                onChange={() => setPostingType("groups")}
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
            }}
          >
            {loading ? "Posting..." : "Start Posting"}
          </button>
        </div>

        {/* 4-column grid layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "20px",
            height: "calc(100vh - 180px)",
          }}
        >
          {/* Message + Files */}
          <div
            style={{
              gridColumn: "span 2",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <label>
                <strong>Message:</strong>
              </label>
              <textarea
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  height: "200px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  resize: "vertical",
                  marginTop: "8px",
                  outlineColor: "#aaa",
                  fontFamily: "inherit",
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
          <div
            style={{
              backgroundColor: "#f9f9f9",
              padding: "15px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          >
            <div style={{ marginBottom: "15px" }}>
              <strong>Available Devices:</strong>
            </div>
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
                    .filter(
                      ([_, dev]) =>
                        dev.online && !dev.contactPosting && !dev.groupPosting
                    )
                    .map(([name]) => name);

                  setSelectedDevices(e.target.checked ? selectableDevices : []);
                }}
              />{" "}
              <strong>Select All</strong>
            </label>
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
                  return (
                    <div key={name} style={{ marginTop: "5px" }}>
                      <label style={{ color: isPosting ? "gray" : "black" }}>
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(name)}
                          onChange={() => handleDeviceToggle(name)}
                          disabled={isPosting}
                        />{" "}
                        {name} {isPosting && <span>(posting)</span>}
                      </label>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Tags */}
          <div
            style={{
              backgroundColor: "#f9f9f9",
              padding: "15px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          >
            <strong>Available Tags:</strong>
            <div
              style={{
                marginTop: "15px",
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
          </div>
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
          minWidth: "350px",
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
            onChange={(e) => setTempCaption(e.target.value)}
            style={{
              width: "100%",
              height: "120px",
              marginTop: "10px",
              marginBottom: "15px",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              outlineColor: "#aaa",
              fontFamily: "inherit",
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
