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
            /* Mobile styles */
            @media (max-width: 767px) {
              body {
                padding: 1rem;
              }
              h1 {
                font-size: 1.8rem;
              }
              header {
                flex-direction: column;
              }
            }
          `,
          }}
        />
      </head>
      <body>
        <header>
          <h1>📋 WAA Control Panel</h1>
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
