import { redirect } from "next/navigation";

export const metadata = {
  title: "Video Test — Eventzone",
  description: "Laboratoire de design interactif avec arrière-plan vidéo cinématique pour Eventzone.",
};

export default function VideoTestPage() {
  redirect("/features/video-test");
}
