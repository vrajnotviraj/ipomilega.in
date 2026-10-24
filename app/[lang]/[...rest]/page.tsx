import { notFound } from "next/navigation";

/** Any path no page owns, so the 404 renders in the page's language. */
export default function CatchAll() {
  notFound();
}
