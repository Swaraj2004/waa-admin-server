type MessageInputProps = {
  message: string;
  setMessage: (message: string) => void;
  sendAsContact: boolean;
  setSendAsContact: (value: boolean) => void;
  isDesktop?: boolean;
  isMobile?: boolean;
};

const MessageInput = ({
  message,
  setMessage,
  sendAsContact,
  setSendAsContact,
  isDesktop,
  isMobile,
}: MessageInputProps) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap", // Added for mobile wrapping
          gap: "10px", // Added for spacing on wrap
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
          height: isDesktop ? "200px" : "150px",
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
    </>
  );
};

export default MessageInput;
