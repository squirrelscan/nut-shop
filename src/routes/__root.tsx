import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { htmlLang } from "#/lib/html";
import { NotFoundPage } from "#/pages/misc";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <>
      <title>Page not found | The Nut Shop</title>
      <meta name="robots" content="noindex, follow" />
      <meta name="description" content="The page you were looking for does not exist." />
      <NotFoundPage />
    </>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={htmlLang()}>
      <head>
        <HeadContent />
        <link rel="stylesheet" href={appCss} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
