import { createFileRoute } from "@tanstack/react-router";
import { FaqPage } from "#/pages/content";
import { faqHead } from "#/seo/head";

export const Route = createFileRoute("/faq")({ head: () => faqHead(), component: FaqPage });
