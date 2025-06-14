import { useEffect, useState } from "hono/jsx";
import { useResponsive } from "../hooks/useResponsive";
import CaptionDialog from "./CaptionDialog";
import Card from "./Card";
import DeviceList from "./DeviceList";
import FileUploader from "./FileUploader";
import MessageInput from "./MessageInput";
import PostingControls from "./PostingControls";
import TagList from "./TagList";

type Device = {
  contactTags: string[];
  groupTags: string[];
  online: boolean;
  contactPosting: boolean;
  groupPosting: boolean;
  queueCount: number;
};

type DevicesMap = Record<string, Device>;

const PostingPage = () => {
  const { isMobile, isDesktop } = useResponsive();
  const [postingType, setPostingType] = useState<"contact" | "group">("group");
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
    const maxSize = 25 * 1024 * 1024; // 25 MB

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

  return (
    <>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: "100%",
        }}
      >
        <PostingControls
          postingType={postingType}
          setPostingType={setPostingType}
          startPosting={startPosting}
          loading={loading}
          isMobile={isMobile}
        />

        {isDesktop ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "20px",
              height: "calc(100vh - 180px)",
            }}
          >
            <div style={{ gridColumn: "span 2" }}>
              <Card style={{ height: "92%" }}>
                <MessageInput
                  message={message}
                  setMessage={setMessage}
                  sendAsContact={sendAsContact}
                  setSendAsContact={setSendAsContact}
                  isDesktop={isDesktop}
                />
                <FileUploader
                  files={files}
                  setFiles={setFiles}
                  handleFileChange={handleFileChange}
                  openCaptionDialog={openCaptionDialog}
                  isDesktop={isDesktop}
                />
              </Card>
            </div>
            <DeviceList
              devices={devices}
              selectedDevices={selectedDevices}
              setSelectedDevices={setSelectedDevices}
              handleDeviceToggle={handleDeviceToggle}
              isDesktop={isDesktop}
            />
            <TagList
              uniqueTags={uniqueTags}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              isDesktop={isDesktop}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <DeviceList
              devices={devices}
              selectedDevices={selectedDevices}
              setSelectedDevices={setSelectedDevices}
              handleDeviceToggle={handleDeviceToggle}
            />
            <TagList
              uniqueTags={uniqueTags}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              isMobile={isMobile}
            />
            <Card style={{ height: "fit-content" }}>
              <MessageInput
                message={message}
                setMessage={setMessage}
                sendAsContact={sendAsContact}
                setSendAsContact={setSendAsContact}
                isMobile={isMobile}
              />
              <FileUploader
                files={files}
                setFiles={setFiles}
                handleFileChange={handleFileChange}
                openCaptionDialog={openCaptionDialog}
                isMobile={isMobile}
              />
            </Card>
          </div>
        )}
      </div>

      <CaptionDialog
        tempCaption={tempCaption}
        setTempCaption={setTempCaption}
        saveCaption={saveCaption}
        setCaptionDialogIndex={setCaptionDialogIndex}
        isMobile={isMobile}
      />
    </>
  );
};

export default PostingPage;
