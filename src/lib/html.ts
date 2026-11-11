import { fault } from "../../faults/runtime";

/** `lang` is omitted by the html-lang-missing fault. */
export const htmlLang = (): string | undefined => (fault("html-lang-missing") ? undefined : "en");
