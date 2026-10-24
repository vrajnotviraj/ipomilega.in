import { useRouter } from "next/navigation";
import { useProgress } from "@/components/progress/ProgressProvider";
import { useLocale } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/locales";

/** router.push for a site path, in the page's language, with the progress bar; ProgressProvider finishes it when the route changes. */
export const useProgressRouter = () => {
  const router = useRouter();
  const locale = useLocale();
  const { startProgress } = useProgress();

  const push = (sitePath: string) => {
    startProgress();
    router.push(localePath(locale, sitePath));
  };

  return { push };
};
