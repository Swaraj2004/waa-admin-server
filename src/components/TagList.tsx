import Card from "./Card";

type TagListProps = {
  uniqueTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[] | ((prev: string[]) => string[])) => void;
  isDesktop?: boolean;
  isMobile?: boolean;
};

const TagList = ({
  uniqueTags,
  selectedTags,
  setSelectedTags,
  isDesktop,
  isMobile,
}: TagListProps) => {
  return (
    <Card
      title="Available Tags:"
      style={{
        height: isDesktop ? "92%" : "200px",
        marginBottom: isDesktop ? "0" : "1rem",
      }}
    >
      <div
        style={{
          maxHeight: isDesktop ? "450px" : "150px",
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
  );
};

export default TagList;
