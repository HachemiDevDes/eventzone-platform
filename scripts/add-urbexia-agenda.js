const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const url = 'https://gknglowozpewwrtjumuc.supabase.co';
const key = 'sb_publishable_0bdK2TAGnlyUKCnloX1Dug_Sg5uedKc';
const sb = createClient(url, key);

const eventId = 'f16b8b30-9e45-4bf8-a31d-5f39f60a7a3e';
const eventDate = '2026-11-12';
const zephyrLogo = 'https://pub-f27e9abad6974c9f90cac9632f24cbb0.r2.dev/f16b8b30-9e45-4bf8-a31d-5f39f60a7a3e/event-images/gemini_generated_image_b2k770b_1789737881899_02o5yh4q.webp';

const sessionsData = [
  {
    num: 1,
    title: 'Conférence inaugurale (vision stratégique)',
    track: '1. CONFÉRENCE INAUGURALE',
    startTime: '09:00',
    endTime: '09:45',
    description: "THÈME : « Le rôle stratégique de la planification et du développement urbain durable à l'horizon 2030 » — Conférence d'ouverture stratégique posant les jalons et orientations majeures de la ville durable en Algérie.",
    speaker: {
      name: 'Professeur Mourad Kouachi',
      title: 'Président de la Commission développement local & aménagement du territoire (CNESE)',
      jobTitle: 'Professeur universitaire et expert économique',
      company: 'CNESE',
      role: 'Keynote Speaker',
      bio: "Professeur universitaire et expert économique, Président de la Commission de développement local et d'aménagement du territoire (CNESE).",
      topic: "Le rôle stratégique de la planification et du développement urbain durable à l'horizon 2030",
      avatar: 'https://ui-avatars.com/api/?name=Mourad+Kouachi&background=0284c7&color=fff&size=256&bold=true'
    }
  },
  {
    num: 2,
    title: 'Transformation digitale du BTP',
    track: '2. TRANSFORMATION DIGITALE DU BTP',
    startTime: '09:45',
    endTime: '10:30',
    description: "THÈME : « La construction digitale (BIM, automatisation, IA et bâtiments durables) » — Analyse des leviers technologiques pour transformer la conception, la modélisation et la réalisation des chantiers modernes.",
    speaker: {
      name: 'M. Hellassa Oussama',
      title: 'CEO & Expert BIM',
      jobTitle: 'Expert BIM – CEO Dorouscom & Autres Ingénierie',
      company: 'Dorouscom & Autres Ingénierie',
      role: 'Speaker',
      bio: "Expert BIM et dirigeant de Dorouscom & Autres Ingénierie, spécialiste de la maquette numérique et de la numérisation des processus du bâtiment.",
      topic: 'La construction digitale (BIM, automatisation, IA et bâtiments durables)',
      avatar: 'https://ui-avatars.com/api/?name=Oussama+Hellassa&background=2563eb&color=fff&size=256&bold=true'
    }
  },
  {
    num: 3,
    title: 'BIM, automatisation & Intelligence Artificielle',
    track: '3. BIM, AUTOMATISATION & INTELLIGENCE ARTIFICIELLE',
    startTime: '10:30',
    endTime: '11:15',
    description: "THÈME : « BIM, automatisation et intelligence artificielle : vers une nouvelle génération d'études techniques du bâtiment » — Exploration des synergies entre intelligence artificielle, automatisation des calculs et ingénierie de pointe.",
    speaker: {
      name: 'Mme Mebarki Chahrazed',
      title: 'Docteure en sciences du bâtiment & Formatrice certifiée CYPE',
      jobTitle: "Enseignante à l'USTHB – Docteure en sciences du bâtiment – Ingénieure MIEP – Formatrice certifiée CYPE",
      company: 'USTHB / CYPE',
      role: 'Speaker',
      bio: "Enseignante à l'USTHB, Docteure en sciences du bâtiment, Ingénieure MIEP et Formatrice certifiée CYPE.",
      topic: "BIM, automatisation et intelligence artificielle : vers une nouvelle génération d'études techniques du bâtiment",
      avatar: 'https://ui-avatars.com/api/?name=Chahrazed+Mebarki&background=7c3aed&color=fff&size=256&bold=true'
    }
  },
  {
    num: 4,
    title: 'Digitalisation terrain',
    track: '4. DIGITALISATION TERRAIN',
    startTime: '11:15',
    endTime: '12:00',
    description: "THÈME : « Digitaliser le BTP algérien sans déposséder ses métiers : retour d'expérience du terrain » — Solutions concrètes pour connecter chantiers, artisans, techniciens et encadrement avec des outils mobiles adaptés.",
    speaker: {
      name: 'M. Abdenour Amghar',
      title: 'CTO SARL Herfa Mirotech & Cofondateur Herfa',
      jobTitle: 'CTO SARL Herfa Mirotech & Cofondateur Herfa',
      company: 'SARL Herfa Mirotech / Herfa',
      role: 'Speaker',
      bio: 'CTO de SARL Herfa Mirotech et Cofondateur de Herfa, acteur majeur de la digitalisation des corps de métiers du BTP.',
      topic: "Digitaliser le BTP algérien sans déposséder ses métiers : retour d'expérience du terrain",
      avatar: 'https://ui-avatars.com/api/?name=Abdenour+Amghar&background=0d9488&color=fff&size=256&bold=true'
    }
  },
  {
    num: 5,
    title: 'Efficacité énergétique',
    track: '5. EFFICACITÉ ÉNERGÉTIQUE',
    startTime: '12:00',
    endTime: '12:45',
    description: "THÈME : « L'efficacité énergétique des bâtiments en Algérie : exemples et perspectives » — Présentation des normes thermiques, des innovations d'isolation et des retours d'expérience du CNERIB.",
    speaker: {
      name: 'Mme Limam Amel',
      title: 'Maître de recherche',
      jobTitle: 'Maître de recherche au CNERIB',
      company: 'CNERIB',
      role: 'Speaker',
      bio: "Maître de recherche au Centre National d'Études et de Recherches Intégrées du Bâtiment (CNERIB), spécialiste de la performance énergétique.",
      topic: "L'efficacité énergétique des bâtiments en Algérie : exemples et perspectives",
      avatar: 'https://ui-avatars.com/api/?name=Amel+Limam&background=059669&color=fff&size=256&bold=true'
    }
  },
  {
    num: 6,
    title: 'Rénovation des bétons armés',
    track: '6. RÉNOVATION DES BÉTONS ARMÉS',
    startTime: '14:00',
    endTime: '14:45',
    description: "THÈME : « Rénovation et réparation des bétons armés – Les solutions techniques avec les mortiers suivant la norme EN 1504 » — Diagnostic des pathologies structurelles, traitement anticorrosion et pérennisation des ouvrages d'art.",
    speaker: {
      name: 'Mme Azzi Siham',
      title: 'Responsable Prescription Technique',
      jobTitle: 'Responsable Prescription Technique – Sika Algérie',
      company: 'Sika Algérie',
      role: 'Speaker',
      bio: 'Responsable Prescription Technique chez Sika Algérie, spécialiste des solutions chimiques de réhabilitation du béton et mortiers normalisés EN 1504.',
      topic: 'Rénovation et réparation des bétons armés – Les solutions techniques avec les mortiers suivant la norme EN 1504',
      avatar: 'https://ui-avatars.com/api/?name=Siham+Azzi&background=ea580c&color=fff&size=256&bold=true'
    }
  },
  {
    num: 7,
    title: 'Pathologies et rénovation des façades',
    track: '7. PATHOLOGIES & RÉNOVATION DES FAÇADES',
    startTime: '14:45',
    endTime: '15:30',
    description: "THÈME : « Pathologies et rénovation des façades : comprendre, diagnostiquer et agir » — Guide d'auscultation technique, détection des fissures et infiltrations, et protocoles durables de ravalement.",
    speaker: {
      name: 'Mme Ghazia Assameur',
      title: 'Ingénieure Génie Civil & Experte BTP',
      jobTitle: 'Ingénieure Génie Civil – Experte BTP – Formatrice certifiée',
      company: 'Experte BTP – Formatrice certifiée',
      role: 'Speaker',
      bio: "Ingénieure en Génie Civil, experte BTP et formatrice certifiée dans l'audit des façades et la gestion des désordres du bâti.",
      topic: 'Pathologies et rénovation des façades : comprendre, diagnostiquer et agir',
      avatar: 'https://ui-avatars.com/api/?name=Ghazia+Assameur&background=db2777&color=fff&size=256&bold=true'
    }
  },
  {
    num: 8,
    title: 'Matériaux innovants',
    track: '8. MATÉRIAUX INNOVANTS',
    startTime: '15:30',
    endTime: '16:15',
    description: "THÈME : « Les polymères intelligents, une nouvelle génération de matériaux pour l'industrie de la construction » — Vitrages intelligents, thermorégulation passive et rupture technologique dans les enveloppes architecturales.",
    speaker: {
      name: 'Mme Rym Bouili',
      title: 'CEO Eco Smart Glass',
      jobTitle: 'CEO Eco Smart Glass',
      company: 'Eco Smart Glass',
      role: 'Speaker',
      bio: 'Fondatrice et CEO de Eco Smart Glass, pionnière des technologies de verre électrochrome et polymères adaptatifs en Algérie.',
      topic: "Les polymères intelligents, une nouvelle génération de matériaux pour l'industrie de la construction",
      avatar: 'https://ui-avatars.com/api/?name=Rym+Bouili&background=4f46e5&color=fff&size=256&bold=true'
    }
  },
  {
    num: 9,
    title: 'Investissement immobilier',
    track: '9. INVESTISSEMENT IMMOBILIER',
    startTime: '16:15',
    endTime: '17:00',
    description: "THÈME : « L'investissement immobilier pour la diaspora algérienne » — Cadre réglementaire, opportunités foncières, canaux de financement et solutions digitales dédiées à la diaspora.",
    speaker: {
      name: 'M. Sang Sider Smail',
      title: 'Consultant immobilier & CEO',
      jobTitle: 'Consultant immobilier & CEO Boonyaninfo',
      company: 'Boonyaninfo',
      role: 'Speaker',
      bio: "Consultant immobilier reconnu et CEO de Boonyaninfo, expert de l'attractivité foncière et des programmes d'investissement pour la diaspora.",
      topic: "L'investissement immobilier pour la diaspora algérienne",
      avatar: 'https://ui-avatars.com/api/?name=Smail+Sang+Sider&background=0891b2&color=fff&size=256&bold=true'
    }
  }
];

async function insertAll() {
  // First, verify and remove any prior duplicate sessions for this event if any exist
  const { data: existing, error: checkErr } = await sb.from('sessions').select('id').eq('event_id', eventId);
  if (existing && existing.length > 0) {
    console.log(`Found ${existing.length} existing sessions, clearing first...`);
    await sb.from('sessions').delete().eq('event_id', eventId);
  }

  const rows = sessionsData.map((s) => {
    const spkId = crypto.randomUUID();
    const speakerObj = {
      id: spkId,
      name: s.speaker.name,
      title: s.speaker.title,
      jobTitle: s.speaker.jobTitle,
      company: s.speaker.company,
      role: s.speaker.role,
      bio: s.speaker.bio,
      topic: s.speaker.topic,
      image: s.speaker.avatar,
      avatar_url: s.speaker.avatar
    };

    return {
      id: crypto.randomUUID(),
      event_id: eventId,
      title: s.title,
      track: s.track,
      date: eventDate,
      start_time: `${eventDate}T${s.startTime}:00+00:00`,
      end_time: `${eventDate}T${s.endTime}:00+00:00`,
      description: s.description,
      location: 'Salle Principale — Hôtel M Suite, Dar El Beida',
      speakers: [speakerObj],
      moderators: [],
      logos: [
        {
          id: 1,
          image: zephyrLogo,
          label: 'Zephyr Events'
        }
      ]
    };
  });

  const { data, error } = await sb.from('sessions').insert(rows).select();
  if (error) {
    console.error('Error inserting sessions:', error);
  } else {
    console.log(`Successfully inserted ${data.length} sessions for event ${eventId}`);
    data.forEach(d => {
      const spk = (d.speakers && d.speakers[0]) ? d.speakers[0].name : 'N/A';
      console.log(`✔ [${d.start_time.substring(11,16)} - ${d.end_time.substring(11,16)}] ${d.title} (${spk})`);
    });
  }
}

insertAll();
