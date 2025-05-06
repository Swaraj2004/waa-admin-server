import type { FC } from "hono/jsx";

export const Layout: FC = (props) => {
  return (
    <html>
      <head>
        <title>WAA Control Panel</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/x-icon" href="/images/favicon.ico"></link>
      </head>
      <body
        style={{
          fontFamily: "sans-serif",
          margin: "0",
          padding: "2rem",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "1rem",
          }}
        >
          <h1 style={{ margin: "0" }}>📋 WAA Control Panel</h1>
          <nav style={{ display: "flex", gap: "2rem" }}>
            <a
              href="/"
              style={{
                textDecoration: "none",
                color: `${props.path === "/" ? "#007bff" : "#333"}`,
                fontSize: "1.4rem",
                fontWeight: "600",
              }}
            >
              Devices
            </a>
            <a
              href="/posting"
              style={{
                textDecoration: "none",
                color: `${props.path === "/posting" ? "#007bff" : "#333"}`,
                fontSize: "1.4rem",
                fontWeight: "600",
              }}
            >
              Posting
            </a>
          </nav>
        </header>
        <main>{props.children}</main>
      </body>
    </html>
  );
};
