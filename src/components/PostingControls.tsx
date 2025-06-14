type PostingControlsProps = {
  postingType: "contact" | "group";
  setPostingType: (type: "contact" | "group") => void;
  startPosting: () => Promise<void>;
  loading: boolean;
  isMobile: boolean;
};

const PostingControls = ({
  postingType,
  setPostingType,
  startPosting,
  loading,
  isMobile,
}: PostingControlsProps) => {
  return (
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
            checked={postingType === "group"}
            onChange={() => setPostingType("group")}
            style={{ marginTop: "0" }}
          />
          <span>Groups</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <input
            type="radio"
            name="type"
            checked={postingType === "contact"}
            onChange={() => setPostingType("contact")}
            style={{ marginTop: "0" }}
          />
          <span>Contacts</span>
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
  );
};

export default PostingControls;
