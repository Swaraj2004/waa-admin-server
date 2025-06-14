type CaptionDialogProps = {
  tempCaption: string;
  setTempCaption: (caption: string) => void;
  saveCaption: () => void;
  setCaptionDialogIndex: (index: number | null) => void;
  isMobile: boolean;
};

const CaptionDialog = ({
  tempCaption,
  setTempCaption,
  saveCaption,
  setCaptionDialogIndex,
  isMobile,
}: CaptionDialogProps) => {
  return (
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
  );
};

export default CaptionDialog;
