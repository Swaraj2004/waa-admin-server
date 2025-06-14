import Card from "./Card";

type Device = {
  contactTags: string[];
  groupTags: string[];
  online: boolean;
  contactPosting: boolean;
  groupPosting: boolean;
  queueCount: number;
};

type DevicesMap = Record<string, Device>;

type DeviceListProps = {
  devices: DevicesMap;
  selectedDevices: string[];
  setSelectedDevices: (
    devices: string[] | ((prev: string[]) => string[])
  ) => void;
  handleDeviceToggle: (name: string) => void;
  isDesktop?: boolean;
};

const DeviceList = ({
  devices,
  selectedDevices,
  setSelectedDevices,
  handleDeviceToggle,
  isDesktop,
}: DeviceListProps) => {
  const onlineDevices = Object.entries(devices).filter(
    ([_, dev]) => dev.online
  );

  return (
    <Card
      title="Available Devices:"
      style={{
        height: isDesktop ? "92%" : "200px",
        marginBottom: isDesktop ? "0" : "1rem",
      }}
    >
      {onlineDevices.length === 0 ? (
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
            checked={selectedDevices.length === onlineDevices.length}
            onChange={(e) => {
              const selectableDevices = onlineDevices.map(([name]) => name);
              setSelectedDevices(
                (e.target as HTMLInputElement).checked ? selectableDevices : []
              );
            }}
          />{" "}
          <strong>Select All</strong>
        </label>
      )}
      <div
        style={{
          marginTop: "10px",
          maxHeight: isDesktop ? "450px" : "150px",
          overflowY: "auto",
        }}
      >
        {onlineDevices.map(([name, dev]) => {
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
                {queueCount > 0 && <span> ({queueCount} queued)</span>}
              </label>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DeviceList;
