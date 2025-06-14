import type { CSSProperties, PropsWithChildren } from "hono/jsx";

type CardProps = PropsWithChildren<{
  title?: string;
  style?: CSSProperties;
}>;

const Card = ({ children, title, style }: CardProps) => (
  <div
    style={{
      backgroundColor: "#f9f9f9",
      padding: "1.5rem", // Adjusted to be consistent
      border: "1px solid #ccc",
      borderRadius: "8px",
      marginBottom: "1rem", // Default margin for stacking
      ...style, // Apply any passed-in styles, overriding defaults if necessary
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

export default Card;
