import { redirect } from "next/navigation";

export const metadata = {
  title: "Conversion Social Media & Marketing Événementiel — Eventzone",
  description: "Transformez vos abonnés Instagram, TikTok et LinkedIn en participants confirmés et clients payants avec Eventzone.",
};

export default function VideoTestPage() {
  redirect("/features/video-test");
}
