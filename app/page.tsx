import Showcase from "@/components/Showcase";
import { Analytics } from "@vercel/analytics/next";

export default function Page() {
  return (
    <>
      <Showcase />
      <Analytics />
    </>
  );
}
