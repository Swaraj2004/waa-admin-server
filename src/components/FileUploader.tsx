type FileUploaderProps = {
  files: { file: File; caption: string }[];
  setFiles: (
    files:
      | { file: File; caption: string }[]
      | ((
          prev: { file: File; caption: string }[]
        ) => { file: File; caption: string }[])
  ) => void;
  handleFileChange: (e: Event) => void;
  openCaptionDialog: (index: number) => void;
  isDesktop?: boolean;
  isMobile?: boolean;
};

const FileUploader = ({
  files,
  setFiles,
  handleFileChange,
  openCaptionDialog,
  isDesktop,
  isMobile,
}: FileUploaderProps) => {
  return (
    <>
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
            maxHeight: isDesktop ? "300px" : "200px",
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
                    setFiles((prev) => {
                      const updated = [...prev];
                      updated.splice(idx, 1);
                      return updated;
                    });
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
    </>
  );
};

export default FileUploader;
