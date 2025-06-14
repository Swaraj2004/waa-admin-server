import type { FC } from "hono/jsx";

export const Layout: FC = (props) => {
  return (
    <html>
      <head>
        <title>WAA Control Panel</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/x-icon" href="/images/favicon.ico"></link>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            body {
              font-family: sans-serif;
              margin: 0;
              padding: 2rem;
            }
            header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 1rem;
              padding-bottom: 1rem;
            }
            h1 {
              margin: 0;
            }
            nav {
              display: flex;
              gap: 2rem;
            }
            nav a {
              text-decoration: none;
              font-size: 1.4rem;
              font-weight: 600;
            }
            .title-and-button {
              display: flex;
              align-items: center;
              gap: 30px;
            }
            /* Mobile styles */
            @media (max-width: 860px) {
              body {
                padding: 1rem;
              }
              h1 {
                font-size: 1.8rem;
              }
              header {
                flex-direction: column;
              }
              .title-and-button {
                gap: 0;
              }
              .title-and-button button {
                display: none;
              }
            }
          `,
          }}
        />
      </head>
      <body>
        <header>
          <div className="title-and-button">
            <h1>📋 WAA Control Panel</h1>
            <a
              href="https://github.com/CRoadSolutions/waa-setup/releases"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
              }}
            >
              <button
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "600",
                }}
              >
                Download Software
              </button>
            </a>
          </div>
          <nav>
            <a
              href="/"
              style={{
                color: `${props.path === "/" ? "#007bff" : "#333"}`,
              }}
            >
              Devices
            </a>
            <a
              href="/posting"
              style={{
                color: `${props.path === "/posting" ? "#007bff" : "#333"}`,
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
