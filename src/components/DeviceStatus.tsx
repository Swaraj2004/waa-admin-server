import { useEffect, useState } from "hono/jsx";
import { useResponsive } from "../hooks/useResponsive";

type DeviceInfo = {
  online: boolean;
  contactTags: string[];
  groupTags: string[];
  contactPosting: boolean;
  groupPosting: boolean;
};

export function DeviceStatus() {
  const [devices, setDevices] = useState<Record<string, DeviceInfo>>({});
  const [notifications, setNotifications] = useState<string[]>([]);
  const { isMobile } = useResponsive();

  useEffect(() => {
    const fetchDevices = () => {
      fetch("/api/devices")
        .then((res) => res.json())
        .then((newDevices: Record<string, DeviceInfo>) => {
          setDevices((oldDevices) => {
            for (const [name, newDevice] of Object.entries(newDevices)) {
              const oldDevice = oldDevices[name];
              if (oldDevice?.online && !newDevice.online) {
                setNotifications((prev) => [
                  `❌ ${name} disconnected`,
                  ...prev,
                ]);
              }
            }
            return newDevices;
          });
        })
        .catch(console.error);
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
        height: "calc(100vh - 128px)",
        gap: "1rem",
        boxSizing: "border-box",
      }}
    >
      {/* Devices List */}
      <div
        style={{
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: isMobile ? "1rem" : "2rem",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h2
          style={{
            margin: "0 0 1rem",
            fontSize: isMobile ? "1.25rem" : "1.5rem",
          }}
        >
          Devices
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: isMobile ? "center" : "flex-start",
          }}
        >
          {Object.entries(devices).map(([name, device]) => (
            <div
              key={name}
              style={{
                width: isMobile ? "100%" : "220px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "0 1rem",
                background: `${device.online ? "#e6ffed" : "#fff5f5"}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  margin: "1rem 0 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3
                  style={{
                    margin: "0",
                    fontSize: isMobile ? "1rem" : "1.17rem",
                  }}
                >
                  📱 {name}
                </h3>
                <p
                  style={{
                    margin: "0",
                    padding: "0.25rem 1rem",
                    borderRadius: "12px",
                    background: `${device.online ? "#d1e7dd" : "#f8d7da"}`,
                    color: `${device.online ? "#0f5132" : "#842029"}`,
                    fontWeight: "bold",
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  }}
                >
                  {device.online ? "Online" : "Offline"}
                </p>
              </div>
              <p style={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                Contact Posting:{" "}
                <strong
                  style={{
                    color: `${device.contactPosting ? "#0f5132" : "#842029"}`,
                  }}
                >
                  {device.contactPosting ? "On" : "Off"}
                </strong>
              </p>
              <p style={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                Group Posting:{" "}
                <strong
                  style={{
                    color: `${device.groupPosting ? "#0f5132" : "#842029"}`,
                  }}
                >
                  {device.groupPosting ? "On" : "Off"}
                </strong>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications - Only show on desktop */}
      {!isMobile && (
        <div
          style={{
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2
            style={{
              margin: "0 0 1rem",
            }}
          >
            Notifications
          </h2>
          {notifications.length === 0 ? (
            <p
              style={{
                color: "#888",
                textAlign: "center",
                paddingTop: "1rem",
                margin: "0",
              }}
            >
              No disconnections yet.
            </p>
          ) : (
            notifications.map((note, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "1rem",
                  padding: "1.5rem",
                  border: "1px solid #f5c2c7",
                  borderRadius: "6px",
                  background: "#f8d7da",
                  color: "#842029",
                  fontWeight: "bold",
                }}
              >
                {note}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
