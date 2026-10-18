import { fetchFormById, fetchEventDetails } from "../../../lib/db";
import { stripHtml } from "../../../lib/constants";
import PublicFormClient from "./PublicFormClient";

export async function generateMetadata(props) {
  const resolvedParams = props?.params ? await props.params : {};
  const formId = resolvedParams?.id;

  if (!formId) {
    return {
      title: "Public Form | Eventzone",
      description: "Complete and submit this form on Eventzone.",
    };
  }

  let form = null;
  try {
    form = await fetchFormById(formId);
  } catch (e) {
    console.warn("generateMetadata fetchFormById warning:", e);
  }

  if (!form) {
    return {
      title: "Form | Eventzone",
      description: "Complete and submit this form on Eventzone.",
    };
  }

  const plainDesc = stripHtml(form.description || "Complete and submit this form on Eventzone.");
  const title = `${form.title || "Form"} | Eventzone`;

  return {
    title,
    description: plainDesc,
    openGraph: {
      title,
      description: plainDesc,
      siteName: "Eventzone",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${form.title || "Form"} | Eventzone`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: plainDesc,
      images: ["/og-image.png"],
    },
  };
}

export default async function FormPage(props) {
  const resolvedParams = props?.params ? await props.params : {};
  const formId = resolvedParams?.id;

  let form = null;
  let event = null;

  if (formId) {
    try {
      form = await fetchFormById(formId);
      if (form && (form.eventId || form.event_id)) {
        event = await fetchEventDetails(form.eventId || form.event_id).catch(() => null);
      }
    } catch (e) {
      console.warn("FormPage fetchFormById notice:", e);
    }
  }

  return (
    <PublicFormClient
      formId={formId}
      initialForm={form}
      initialEvent={event}
    />
  );
}
