import { fault } from "../../faults/runtime";
import { isCataloguePath } from "#/catalogue/paths";

/** `lang` is omitted by the html-lang-missing fault (never on /catalogue/, which is outside the fault system). */
export const htmlLang = (pathname?: string): string | undefined =>
  fault("html-lang-missing") && !(pathname && isCataloguePath(pathname)) ? undefined : "en";
