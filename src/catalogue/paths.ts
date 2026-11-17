/** True for every URL owned by the /catalogue/ section (outside the fault system). */
export const isCataloguePath = (pathname: string): boolean =>
  pathname === "/catalogue" ||
  pathname.startsWith("/catalogue/") ||
  pathname === "/sitemap-catalogue.xml";
