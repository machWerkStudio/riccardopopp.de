const body = document.body;
const typed = document.querySelector("#typed");
const progress = document.querySelector(".progress");
const toTop = document.querySelector(".to-top");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const themeToggle = document.querySelector(".theme-toggle");
const langToggle = document.querySelector(".lang-toggle");
const serviceModal = document.querySelector(".service-modal");
const serviceModalTitle = document.querySelector("#service-modal-title");
const serviceModalEyebrow = document.querySelector("#service-modal-eyebrow");
const serviceModalContent = document.querySelector(".service-modal-content");
const serviceModalClose = document.querySelector(".service-modal-close");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if (window.location.hash) {
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

function forceTop() {
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    updateScroll();
  });
  setTimeout(() => {
    window.scrollTo(0, 0);
    updateScroll();
  }, 80);
}

const translations = {
  de: {
    title: "Riccardo Popp - App Entwicklung, Design & Creative Development",
    metaDescription: "Riccardo Popp – App-Entwickler, Digital Designer & Creative Developer. Flutter-Apps, UI/UX, Webdesign, Branding und Social Media Content. 11+ Jahre Erfahrung, 120+ Projekte.",
    nav: {
      about: "Über mich",
      services: "Leistungen",
      projects: "Projekte",
      reviews: "Stimmen",
      contact: "Kontakt"
    },
    hero: {
      prefix: "Hallo, ich bin Riccardo.",
      rolePrefix: "Ich bin",
      subtitle: "Ich gestalte digitale Erlebnisse, die inspirieren und Menschen weltweit begeistern",
      cta: "Meine Arbeiten ansehen",
      phrases: ["App-Entwickler.", "Digital Designer.", "Creative Developer.", "UI Engineer."]
    },
    about: {
      statExperience: "Jahre Erfahrung",
      statProjects: "Projekte umgesetzt",
      eyebrow: "Über mich",
      title: "Ich gestalte heute die digitalen Erlebnisse von morgen",
      copy:
        "Ich bin Mediengestalter, Social Media Creator und App-Entwickler. Ich verbinde Gestaltung, Content und Technik zu digitalen Erlebnissen, die klar aussehen, sich gut anfühlen und Menschen erreichen.",
      link: "Lass uns zusammenarbeiten"
    },
    skills: {},
    metrics: {
      satisfaction: "Kundenzufriedenheit",
      brands: "Marken gestartet",
      users: "Nutzer erreicht",
      appIdeas: "App-Ideen"
    },
    services: {
      eyebrow: "Was ich mache",
      title: "Ideen, die sichtbar werden",
      copy: "Von auffälligen Aktionen über Content bis zur App und druckfertigen Gestaltung: Ideen werden so umgesetzt, dass sie hängen bleiben.",
      more: "Mehr erfahren",
      modalEyebrow: "Leistung",
      card1: {
        title: "Guerilla Marketing",
        copy: "Aktionen, die Menschen mitten im Alltag überraschen, Gespräche auslösen und nicht wie plumpe Werbung wirken.",
        detailIntro: [
          "Klassische Werbung sieht man überall. Man scrollt daran vorbei, läuft daran vorbei und blendet sie aus. Guerilla Marketing geht einen anderen Weg: Es überrascht Menschen genau dort, wo sie nicht mit Werbung rechnen - mitten im Alltag.",
          "Ich entwickle Aktionen, die auffallen, Gespräche auslösen und im besten Fall von selbst weitergetragen werden. Nicht, weil sie einfach nur laut sind, sondern weil sie clever, ungewöhnlich und nah an der Zielgruppe stattfinden.",
          "Dabei geht es nicht um irgendeine verrückte Idee um der Verrücktheit willen. Eine gute Guerilla-Aktion hat eine klare Botschaft, passt zur Marke und fühlt sich für Menschen wie ein Erlebnis an - nicht wie plumpe Werbung."
        ],
        detailSections: [
          {
            title: "Mögliche Aktionen",
            items: [
              {
                title: "Reverse Graffiti",
                text: "Statt Farbe aufzutragen, entsteht die Botschaft durch gezieltes Reinigen verschmutzter Flächen mit Wasser, Schablonen und Hochdruckreiniger. Das wirkt urban, überraschend und passt besonders gut zu nachhaltigen oder kreativen Marken."
              },
              {
                title: "Street Stencils",
                text: "Mit Schablonen, Kreide oder temporären Materialien lassen sich kurze Botschaften lokal sichtbar machen - zum Beispiel rund um Stores, Events oder stark besuchte Stadtbereiche."
              },
              {
                title: "Walking Acts",
                text: "Promoter oder Performer werden als Teil einer Idee inszeniert: als Markenbotschafter, Fotomotiv oder interaktiver Charakter. So entsteht Kontakt, der spannender ist als klassische Flyer-Promotion."
              },
              {
                title: "Pop-up-Aktionen",
                text: "Eine Marke taucht unerwartet auf: mit einem Stand, einer Installation, einer Sampling-Aktion oder einem kleinen Erlebnis. Schnell aufgebaut, aufmerksamkeitsstark und ideal für echte Reaktionen."
              },
              {
                title: "Sticker-, QR- und Ambient-Kampagnen",
                text: "Clever platzierte Sticker, Bodenaufkleber, QR-Codes oder Raumideen können Neugier wecken und Menschen direkt zu Landingpages, Gewinnspielen oder Aktionen führen."
              },
              {
                title: "Sampling mit Twist",
                text: "Produkte werden nicht nur verteilt, sondern in ein kleines Erlebnis verpackt: Challenge, Mini-Spiel, überraschende Verpackung oder Interaktion vor Ort."
              }
            ]
          }
        ],
        detailClosing: [
          "Ich starte jede Aktion mit einer einfachen Frage: Was soll bei den Menschen hängen bleiben?",
          "Daraus entwickle ich ein Konzept, das zur Marke, zum Budget, zur Zielgruppe und zum gewünschten Effekt passt. Ich denke Standort, Timing, Genehmigungen, Produktion, Personal und Content-Verwertung direkt mit.",
          "Eine gute Guerilla-Kampagne sieht spontan aus - ist aber sauber geplant."
        ],
        intro: "",
        itemsTitle: "",
        items: [],
        closing: ""
      },
      card2: {
        title: "Social Media & Contentproduktion",
        copy: "Reels, Posts, Fotos, UGC-Style Clips und Kampagnen, die natürlich wirken, Vertrauen aufbauen und nicht einfach weggescrollt werden.",
        detailIntro: [
          "Social Media ist voll. Jeder postet, jeder wirbt, jeder will Aufmerksamkeit. Genau deshalb reicht es nicht mehr, einfach nur irgendwas online zu stellen.",
          "Ich entwickle Content, der schnell verstanden wird, zur Marke passt und Menschen dazu bringt, kurz hängen zu bleiben. Keine austauschbaren Hochglanz-Inhalte ohne Seele, sondern Formate, die auffallen, Vertrauen aufbauen und Lust machen, mehr zu sehen.",
          "Dabei geht es nicht nur um schöne Bilder oder kurze Videos. Es geht darum, eine Marke so zu zeigen, dass sie greifbar wird: ehrlich, klar, wiedererkennbar und mit einem Look, der im Kopf bleibt."
        ],
        detailSections: [
          {
            title: "Mögliche Content-Formate",
            items: [
              {
                title: "Reels & Short Videos",
                text: "Kurze Videos mit starkem Hook, schnellen Schnitten, passenden Sounds, Untertiteln und klarer Botschaft für Instagram, TikTok, YouTube Shorts oder Ads."
              },
              {
                title: "Behind-the-Scenes Content",
                text: "Einblicke in Produktion, Team, Alltag, Aufbau oder Vorbereitung, damit Unternehmen persönlicher und nahbarer werden."
              },
              {
                title: "Produkt-Content",
                text: "Produkte werden nicht nur gezeigt, sondern verständlich inszeniert: Anwendung, Details, Vorher-Nachher, Unboxing oder Problem-Lösung-Szenen."
              },
              {
                title: "Personal Branding Content",
                text: "Für Selbstständige, Gründer, Dienstleister oder Geschäftsführer entwickle ich Inhalte, die Expertise zeigen, ohne gestellt zu wirken."
              },
              {
                title: "Event-Content & Recaps",
                text: "Ich begleite Veranstaltungen mit Foto- und Videocontent und mache daraus Reels, Stories, Recaps oder Aftermovies."
              },
              {
                title: "UGC-Style Content & Social Ads Creatives",
                text: "Authentisch wirkende Clips und Anzeigenmotive, die für organische Posts oder bezahlte Kampagnen genutzt werden können."
              }
            ]
          }
        ],
        detailClosing: [
          "Guter Content entsteht nicht nebenbei. Er sieht oft locker aus - ist aber sauber geplant.",
          "Ich starte mit der Frage, was der Content erreichen soll: mehr Sichtbarkeit, mehr Vertrauen, mehr Anfragen, mehr Verkäufe oder einfach einen stärkeren Markenauftritt.",
          "Danach plane ich Ideen, Formate, Drehorte, Szenen und Looks und übernehme je nach Projekt Foto, Video, Schnitt, Untertitel, Sound, Format-Anpassungen und die Vorbereitung für Social Media oder Ads."
        ],
        intro: "",
        itemsTitle: "",
        items: [],
        closing: ""
      },
      card3: {
        title: "App-Entwicklung",
        copy: "Apps, Web-Apps, MVPs und digitale Tools mit klarer Struktur, moderner Oberfläche und Funktionen, die wirklich genutzt werden.",
        detailIntro: [
          "Eine App ist schnell geplant. Die größere Frage ist: Warum sollte jemand sie wirklich öffnen, verstehen und regelmäßig benutzen?",
          "Genau da setze ich an. Ich entwickle Apps nicht nach dem Motto Hauptsache digital, sondern mit einem klaren Ziel: Die App soll funktionieren, gut aussehen, sich intuitiv anfühlen und für Nutzer einen echten Mehrwert bieten.",
          "Ob für Kunden, Mitarbeiter, Events, interne Prozesse, Buchungen, Communitys oder digitale Produkte - eine gute App macht Dinge einfacher. Sie spart Zeit, schafft bessere Abläufe und kann aus einer Idee ein echtes digitales Erlebnis machen."
        ],
        detailSections: [
          {
            title: "Mögliche App-Projekte",
            items: [
              {
                title: "Kunden-Apps",
                text: "Apps mit Angeboten, News, Buchungen, Bonusprogrammen, Push-Nachrichten, digitalen Kundenkarten oder exklusiven Inhalten."
              },
              {
                title: "Buchungs- und Termin-Apps",
                text: "Für Studios, Dienstleister, Praxen, Coaches, Restaurants oder lokale Unternehmen, die Abläufe vereinfachen wollen."
              },
              {
                title: "Event-Apps",
                text: "Digitale Begleiter für Messen, Festivals, Konferenzen oder Pop-up-Aktionen mit Zeitplänen, Lageplänen, Tickets oder Interaktionen."
              },
              {
                title: "Community- und Mitarbeiter-Apps",
                text: "Zentrale Orte für Updates, Austausch, Aufgaben, Dokumente, Checklisten, Schulungen oder interne Prozesse."
              },
              {
                title: "Web-Apps, MVPs & Prototypen",
                text: "Browserbasierte Anwendungen, Dashboards, Kundenbereiche oder erste testbare Versionen, um Ideen schnell greifbar zu machen."
              },
              {
                title: "Individuelle Funktionen",
                text: "Login-Bereiche, Profile, Push-Nachrichten, Chats, Karten, Zahlungen, Kalender, QR-Codes, Uploads, Statistiken, Schnittstellen oder Admin-Bereiche."
              }
            ]
          }
        ],
        detailClosing: [
          "Eine gute App beginnt nicht direkt im Code. Sie beginnt mit der Frage: Was soll die App für Nutzer einfacher, besser oder spannender machen?",
          "Daraus entwickle ich ein Konzept, das zur Zielgruppe, zum Unternehmen und zum Budget passt. Ich denke Funktionen, Nutzerführung, Design, technische Umsetzung, Schnittstellen, Inhalte und spätere Erweiterungen zusammen.",
          "Am Ende soll eine App nicht komplizierter machen, was eigentlich einfacher werden soll. Sie soll genau das Gegenteil tun."
        ],
        intro: "",
        itemsTitle: "",
        items: [],
        closing: ""
      },
      card4: {
        title: "Grafikdesign & Print",
        copy: "Flyer, Plakate, Logos, Verpackungen, Geschäftsausstattung und saubere Druckdaten, die professionell aussehen und technisch sitzen.",
        detailIntro: [
          "Gutes Design sieht nicht einfach nur schön aus. Es macht eine Marke verständlich, wiedererkennbar und professionell.",
          "Ob Flyer, Plakate, Visitenkarten, Broschüren, Speisekarten, Verpackungen oder komplette Geschäftsausstattung: Print bleibt stark, wenn er gut gemacht ist. Etwas Gedrucktes liegt in der Hand, bleibt auf dem Tisch und fühlt sich oft greifbarer an als ein schneller Post im Feed.",
          "Ich entwickle Designs, die zur Marke passen, sauber aufgebaut sind und genau den Eindruck erzeugen, der hängen bleiben soll."
        ],
        detailSections: [
          {
            title: "Mögliche Print- und Designprojekte",
            items: [
              {
                title: "Flyer, Plakate & Poster",
                text: "Für Aktionen, Events, Neueröffnungen, Angebote oder lokale Kampagnen mit klarer Botschaft und starkem Look."
              },
              {
                title: "Visitenkarten & Geschäftsausstattung",
                text: "Visitenkarten, Briefpapier, Gutscheine, Stempel, E-Mail-Signaturen, Angebotsvorlagen und ein einheitlicher Markenauftritt."
              },
              {
                title: "Broschüren, Kataloge & Karten",
                text: "Mehrseitige Unterlagen, Speisekarten, Getränkekarten, Preislisten oder Imagehefte mit klarer Struktur und guter Lesbarkeit."
              },
              {
                title: "Verpackungsdesign, Sticker & Labels",
                text: "Etiketten, Boxen, Beutel, Sleeves, Aufkleber oder Give-aways, die im Regal, beim Versand oder beim Auspacken wirken."
              },
              {
                title: "Roll-ups, Banner & Außenwerbung",
                text: "Messegrafiken, Beachflags, Schilder, Fensterbeklebungen, Fahrzeugbeschriftungen oder POS-Materialien."
              },
              {
                title: "Druckdaten-Erstellung & Reinzeichnung",
                text: "Saubere Daten mit Beschnitt, Farbprofilen, passenden Auflösungen, korrekten Maßen und technischen Anforderungen der Druckerei."
              }
            ]
          }
        ],
        detailClosing: [
          "Gutes Printdesign beginnt für mich mit der Frage: Was soll beim Kunden ankommen?",
          "Daraus entwickle ich ein Design, das zur Marke, zur Zielgruppe und zum Einsatzort passt. Ich denke nicht nur an die Optik, sondern auch an Format, Material, Lesbarkeit, Drucktechnik und den Moment, in dem das Design gesehen wird.",
          "Wenn alles steht, bereite ich die Daten so vor, dass sie direkt in den Druck gehen können."
        ],
        intro: "",
        itemsTitle: "",
        items: [],
        closing: ""
      }
    },
    projects: {
      eyebrow: "Aktuelle Projekte",
      titleA: "Woran ich",
      titleB: "gerade arbeite",
      copy: "Ein Einblick in Ideen, Apps und kreative Konzepte, die gerade entstehen, wachsen oder den nächsten Schritt in die Umsetzung machen.",
      liveDemo: "Live-Demo",
      viewCode: "Code ansehen",
      more: "Mehr erfahren",
      beta: "Im Beta-Test",
      development: "In Entwicklung",
      planning: "In Planung",
      all: "Alle Projekte ansehen",
      card1: {
        title: "Fürstenwalde App",
        copy: "Dein Stadtleben. Eine App. News, Events, Vereine, lokale Angebote, Verwaltung, Nachbarschaftshilfe und Bürgerbeteiligung direkt auf deinem Smartphone.",
        description:
          "Fürstenwalde ist die zentrale App für dein Stadtleben in Fürstenwalde und Umgebung. Sie bündelt lokale Nachrichten, Veranstaltungen, Verwaltungsangebote, Vereine, Geschäfte und Community-Funktionen an einem Ort. Ob aktuelle Meldungen aus der Stadt, Events in deiner Nähe, Nachbarschaftshilfe, lokale Angebote, Fundmeldungen, Bürgerbeteiligung oder Informationen zur Verwaltung: Die App hilft dir, schneller zu finden, was vor Ort wichtig ist. Mit Fürstenwalde kannst du lokale Veranstaltungen entdecken, dich mit Gruppen und Vereinen vernetzen, Dinge kaufen, verkaufen oder verleihen, Fragen an die Verwaltung stellen und Push-Benachrichtigungen zu relevanten Neuigkeiten erhalten. Auch lokale Geschäfte, Ärzte, Tourismus-Infos, Politik, Umfragen und Serviceangebote sind direkt erreichbar. Die App richtet sich an Bürgerinnen und Bürger, Vereine, lokale Unternehmen und alle, die Fürstenwalde aktiv erleben und mitgestalten möchten."
      },
      card2: {
        title: "MoodBuddy App",
        copy: "Ein liebevolles Stimmungstagebuch für Kinder, das spielerisch beim Erkennen, Benennen und Verstehen von Gefühlen hilft.",
        description:
          "MoodBuddy ist ein kindgerechtes Stimmungstagebuch, das Kindern hilft, ihre Gefühle besser zu verstehen, zu benennen und auszudrücken. Die App begleitet Kinder spielerisch dabei, ihre aktuelle Stimmung auszuwählen, die Intensität ihres Gefühls einzuschätzen und festzuhalten, was dahintersteckt. Ob fröhlich, traurig, wütend, ängstlich, stolz oder überfordert: MoodBuddy macht Emotionen sichtbar und verständlich. Kinder können ihre Einträge mit Kategorien wie Schule, Freunde, Familie oder Freizeit verbinden und bei Bedarf eigene Notizen oder Sprachnachrichten hinzufügen. Ein liebevoll gestaltetes Gefühls-Lexikon erklärt verschiedene Emotionen altersgerecht und unterstützt Kinder dabei, Worte für ihr inneres Erleben zu finden. Für Eltern bietet MoodBuddy einen geschützten Elternbereich mit hilfreichen Einblicken in die emotionale Entwicklung ihres Kindes. Alle Daten bleiben lokal auf dem Gerät, ohne Cloud, Tracking oder externe Analyse."
      },
      card3: {
        title: "FamilyHub V3",
        copy: "Die digitale Familienzentrale für Organisation, Kommunikation und Alltag. Eine App für alles, was Familien gemeinsam planen und im Blick behalten möchten.",
        description:
          "FamilyHub v3 ist eine moderne Familien-App, die alle wichtigen Bereiche des Familienalltags an einem zentralen Ort bündelt. Die App hilft Familien dabei, Termine, Aufgaben, Einkäufe, Nachrichten, Fotos, Dokumente, Geburtstage, Standorte und Essenspläne gemeinsam zu organisieren. Nach dem Login wird jedes Familienmitglied einer gemeinsamen Familie zugeordnet. Innerhalb dieser Familie können alle relevanten Informationen geteilt und synchronisiert werden. Der Startbildschirm bietet einen schnellen Überblick über wichtige Inhalte wie Wetter, anstehende Termine, den heutigen Essensplan und die wichtigsten App-Funktionen. Zu den zentralen Funktionen gehören ein gemeinsamer Kalender, eine Einkaufsliste, ein Familienchat, eine Fotogalerie, eine Standortkarte, ein Essensplan, Geburtstagsübersichten, Kontakte, Dokumente, Budgetfunktionen und persönliche Einstellungen. Push-Benachrichtigungen informieren Familienmitglieder über neue Nachrichten oder Änderungen an der Einkaufsliste. Die App nutzt Firebase für Anmeldung, Echtzeitdaten, Cloud-Speicherung, Push-Nachrichten und Familien-Synchronisation. Dadurch bleiben Daten wie Chatnachrichten, Einkaufslisten, Termine und Familieninformationen auf allen Geräten aktuell."
      },
      card4: {
        title: "Rentara",
        copy: "Das digitale Betriebssystem für moderne Wohnungsverwaltung, von Schadensmeldungen bis Nebenkostenabrechnung.",
        description:
          "Rentara ist eine vollständig integrierte Plattform für Hausverwaltungen, Wohnungsbaugesellschaften und Immobilienunternehmen. Sie digitalisiert zentrale Prozesse der Wohnungsverwaltung - von der Schadensmeldung über die Handwerker-Beauftragung bis hin zur Rechnungsprüfung, Vertragsverwaltung und Nebenkostenabrechnung. Statt einzelne Tools, E-Mails, Excel-Listen und Papierprozesse miteinander zu kombinieren, bündelt Rentara alle Abläufe in einer einzigen App für Verwalter, Mieter und Handwerker. Mieter können Schäden direkt per App melden, inklusive Foto, Beschreibung und automatischer Wohnungszuordnung. Jede Meldung landet sofort im zentralen Ticket-System. Verwalter sehen offene, laufende und erledigte Fälle in einem Dashboard, können Tickets priorisieren, kommentieren und direkt passenden Handwerkern zuweisen. Handwerker erhalten Aufträge direkt in ihrer App, können Termine vorschlagen, Statusupdates geben und Rechnungen als PDF hochladen. Rechnungen lassen sich prüfen, freigeben und für die Buchhaltung exportieren, zum Beispiel als DATEV-konforme CSV oder über ERP-Webhooks. Rentara verwaltet Gebäude, Wohnungen, Mietverhältnisse, Vertragsdaten, Geräte, Sensoren und Dokumente zentral. Nebenkostenabrechnungen, Digital Twin, Wartungsmanagement, QR-Code-Onboarding, White-Label-Fähigkeit und KI-Unterstützung machen daraus ein umfassendes System für moderne Immobilienprozesse."
      },
      card5: {
        title: "Next Gen Gym OS",
        copy: "Die smarte Plattform für Fitnessstudios mit App-Zugang, Mitgliedschaften, Zahlungen und Studioverwaltung.",
        description:
          "Next Gen Gym OS ist eine digitale Plattform für Fitnessstudios, die Zugangskontrolle, Mitgliedschaften, Zahlungen und Studioverwaltung in einer einzigen App bündelt. Mitglieder öffnen die Studiotür bequem per Smartphone, während Betreiber jederzeit den Überblick über Mitglieder, Auslastung, Geräte und Umsätze behalten. Die App läuft auf iOS, Android und Web und passt sich automatisch an die jeweilige Rolle an. Mitglieder sehen Zugang, Mitgliedschaftsstatus und Rechnungen, Studio-Admins erhalten ein vollständiges Verwaltungs-Dashboard und Plattformbetreiber können mehrere Studios über ein Super-Admin-Portal steuern. Der Zutritt funktioniert per Bluetooth Low Energy mit Live-Prüfung der Mitgliedschaft, sicherem QR-Code-Fallback und biometrischer Bestätigung. Mitgliedschaften, Tarife, Zahlungen, Planwechsel und Kündigungen laufen über Stripe und ein integriertes Kundenportal. Betreiber sehen aktive Mitglieder, Check-ins, Auslastung, Umsätze, Zugangslogs, Geräte-Status, Mitgliederverwaltung und Analytics. Über WebSockets aktualisiert sich die Auslastung live. Die Plattform ist mandantenfähig, skalierbar und basiert auf Flutter, NestJS, PostgreSQL, Stripe, Redis und Sentry."
      },
      card6: {
        title: "Pflege App",
        copy: "Ein Konzept für Pflege, Betreuung, Dokumentation und bessere Abstimmung im Alltag."
      }
    },
    testimonials: {
      eyebrow: "Referenzen",
      titleA: "Kunden",
      titleB: "stimmen",
      copy: "Was Kunden über die Zusammenarbeit sagen",
      selector: "Referenz anzeigen",
      items: [
        {
          name: "Sarah Johnson",
          role: "CEO, TechStart Inc",
          content:
            "Ausgezeichnete Arbeit! Die gelieferte Website hat unsere Erwartungen übertroffen. Professionell, responsiv und pünktlich umgesetzt.",
          image:
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
        },
        {
          name: "Michael Chen",
          role: "Product Manager, InnovateCorp",
          content:
            "Herausragende technische Fähigkeiten und ein beeindruckender Blick fürs Detail. Die App-Entwicklung lief von Anfang bis Ende makellos.",
          image:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
        },
        {
          name: "Emily Rodriguez",
          role: "Gründerin, DesignStudio",
          content:
            "Kreative Lösungen und hervorragende Kommunikation über das gesamte Projekt hinweg. Für anspruchsvolle Webentwicklung absolut empfehlenswert.",
          image:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80"
        },
        {
          name: "David Kim",
          role: "CTO, DataFlow Solutions",
          content:
            "Beeindruckende Performance-Optimierung und saubere Code-Architektur. Die Ergebnisse sprechen für sich.",
          image:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80"
        }
      ]
    },
    contact: {
      title: "Lass uns gemeinsam etwas Besonderes erschaffen",
      copy:
        "Du hast eine App-Idee, brauchst einen starken Auftritt oder willst deine Marke digital besser sichtbar machen? Erzähl mir, wo du hinwillst - ich helfe dir, daraus ein klares Konzept und ein hochwertiges Ergebnis zu machen.",
      quote: '"Der beste Weg, die Zukunft vorherzusagen, ist, sie zu erschaffen."'
    },
    form: {
      title: "Schreib mir eine Nachricht",
      name: "Dein Name",
      namePlaceholder: "Max Mustermann",
      email: "E-Mail-Adresse",
      emailPlaceholder: "max@example.com",
      message: "Deine Nachricht",
      messagePlaceholder: "Erzähl mir von deinem Projekt und wie ich deine Vision zum Leben erwecken kann...",
      submit: "Nachricht senden",
      sending: "Wird gesendet...",
      success: "Danke, deine Nachricht wurde gesendet.",
      error: "Das hat leider nicht geklappt. Es öffnet sich gleich dein Mailprogramm."
    },
    aria: {
      lang: "Sprache wechseln",
      theme: "Darstellung wechseln",
      menu: "Menü öffnen",
      top: "Nach oben"
    }
  },
  en: {
    title: "Riccardo Popp - App Development, Design & Creative Development",
    metaDescription: "Riccardo Popp – App developer, digital designer & creative developer. Flutter apps, UI/UX, web design, branding and social media content. 11+ years experience, 120+ projects.",
    nav: {
      about: "About",
      services: "Services",
      projects: "Projects",
      reviews: "Reviews",
      contact: "Contact"
    },
    hero: {
      prefix: "Hello, I'm Riccardo.",
      rolePrefix: "I'm a",
      subtitle: "Crafting digital experiences that inspire and captivate audiences worldwide",
      cta: "View My Work",
      phrases: ["App Developer.", "Digital Designer.", "Creative Developer.", "UI Engineer."]
    },
    about: {
      statExperience: "Years Experience",
      statProjects: "Projects Delivered",
      eyebrow: "About Me",
      title: "Designing tomorrow's digital experiences today",
      copy:
        "I'm a media designer, social media creator, and app developer. I bring design, content, and technology together to create digital experiences that look clear, feel polished, and reach the right people.",
      link: "Let's collaborate"
    },
    skills: {},
    metrics: {
      satisfaction: "Client Satisfaction",
      brands: "Brands Launched",
      users: "Users Reached",
      appIdeas: "App Ideas"
    },
    services: {
      eyebrow: "What I Do",
      title: "Ideas that become visible",
      copy: "From bold activations and content to apps and print-ready design: ideas are built to be remembered.",
      more: "Learn more",
      modalEyebrow: "Service",
      card1: {
        title: "Guerilla Marketing",
        copy: "Campaigns that surprise people in everyday places, spark conversations, and feel like an experience instead of plain advertising.",
        intro:
          "Classic advertising is everywhere. Guerilla marketing takes a different route: it reaches people in everyday places where they do not expect advertising. I develop actions that stand out, start conversations, and can be shared naturally.",
        itemsTitle: "Possible activations",
        items: [
          "Reverse graffiti with water, stencils, and pressure cleaning",
          "Street stencils with temporary messages in public spaces",
          "Walking acts, pop-ups, and sampling with a twist",
          "Sticker, QR, and ambient campaigns that spark curiosity",
          "Flashmob or performance ideas with strong social potential"
        ],
        closing:
          "Every activation starts with one question: what should people remember? From there, I build a concept that fits the brand, budget, audience, and intended effect."
      },
      card2: {
        title: "Social Media & Content Production",
        copy: "Reels, posts, photos, UGC-style clips, and campaigns that feel natural, build trust, and do not simply get scrolled past.",
        intro:
          "Social media is crowded. Good content needs to be understood quickly, fit the brand, and make people pause for a moment instead of scrolling past.",
        itemsTitle: "Possible content formats",
        items: [
          "Reels, TikToks, Shorts, and social ads creatives",
          "Behind-the-scenes, product content, and personal branding",
          "Image and brand content, event content, and recaps",
          "UGC-style clips for organic posts or paid campaigns",
          "Photo content, stories, community formats, and campaigns"
        ],
        closing:
          "From concept, locations, scenes, and visual direction to editing, captions, sound, and format adaptations, the result is content with a clear purpose."
      },
      card3: {
        title: "App Development",
        copy: "Apps, web apps, MVPs, and digital tools with clear structure, modern interfaces, and features people actually use.",
        intro:
          "An app should not only look good. It needs to be understood, opened, and used. That is why I start with the value it should create for customers, teams, or users.",
        itemsTitle: "Possible app projects",
        items: [
          "Customer apps with offers, news, bookings, or loyalty features",
          "Booking, appointment, event, and community apps",
          "Internal employee apps for tasks, documents, and processes",
          "Web apps, dashboards, customer portals, and digital services",
          "MVPs, prototypes, and apps with custom functionality"
        ],
        closing:
          "From concept to user flow, design, and technical implementation, I build apps that make things easier instead of more complicated."
      },
      card4: {
        title: "Graphic Design & Print",
        copy: "Flyers, posters, logos, packaging, business stationery, and clean print files that look professional and are technically production-ready.",
        intro:
          "Good design does more than look nice. It makes a brand understandable, recognizable, and professional. Print works when design, message, and production are aligned.",
        itemsTitle: "Possible print and design projects",
        items: [
          "Flyers, posters, brochures, and catalogues",
          "Business cards, stationery, and branded templates",
          "Menus, packaging, stickers, labels, and decals",
          "Roll-ups, banners, trade fair graphics, signs, and outdoor ads",
          "Print file preparation, final artwork, and data checks"
        ],
        closing:
          "I consider not only the look, but also format, material, readability, print technique, and clean data with bleed, color profiles, and proper resolution."
      }
    },
    projects: {
      eyebrow: "Current Projects",
      titleA: "What I'm",
      titleB: "working on",
      copy: "A look at ideas, apps, and creative concepts that are currently taking shape, growing, or moving toward their next step.",
      liveDemo: "Live Demo",
      viewCode: "View Code",
      more: "Learn more",
      beta: "In beta testing",
      development: "In development",
      planning: "In planning",
      all: "View All Projects",
      card1: {
        title: "Fürstenwalde App",
        copy: "Your city life. One app. News, events, clubs, local offers, administration, neighborhood help, and citizen participation on your smartphone.",
        description:
          "Fürstenwalde is the central app for city life in Fürstenwalde and the surrounding area. It brings together local news, events, municipal services, clubs, shops, and community features in one place. Whether it is city updates, nearby events, neighborhood help, local offers, lost-and-found posts, citizen participation, or administrative information, the app helps people find what matters locally faster. With Fürstenwalde, users can discover events, connect with groups and clubs, buy, sell, or lend items, ask questions to the administration, and receive push notifications for relevant news. Local businesses, doctors, tourism information, politics, polls, and service offers can also be reached directly."
      },
      card2: {
        title: "MoodBuddy App",
        copy: "A warm mood journal for children that playfully helps them recognize, name, and understand emotions.",
        description:
          "MoodBuddy is a child-friendly mood journal that helps children better understand, name, and express their feelings. The app playfully guides children as they choose their current mood, estimate the intensity of that feeling, and capture what is behind it. Whether happy, sad, angry, anxious, proud, or overwhelmed, MoodBuddy makes emotions visible and easier to understand. Children can connect entries with categories such as school, friends, family, or free time, and add notes or voice messages when needed. A lovingly designed emotion lexicon explains different feelings in an age-appropriate way and helps children find words for their inner experience. For parents, MoodBuddy offers a protected parent area with helpful insights into their child's emotional development. All data stays locally on the device, without cloud, tracking, or external analysis."
      },
      card3: {
        title: "FamilyHub V3",
        copy: "The digital family hub for organization, communication, and everyday life. One app for everything families want to plan, share, and keep in view.",
        description:
          "FamilyHub v3 is a modern family app that brings the most important parts of everyday family life into one central place. It helps families organize appointments, tasks, shopping, messages, photos, documents, birthdays, locations, and meal plans together. After login, each family member is assigned to a shared family. Within that family, all relevant information can be shared and synchronized. The home screen gives a quick overview of weather, upcoming appointments, today's meal plan, and the most important app functions. Core features include a shared calendar, shopping list, family chat, photo gallery, location map, meal planning, birthday overview, contacts, documents, budget features, and personal settings. Push notifications inform family members about new messages or shopping list changes. The app uses Firebase for authentication, real-time data, cloud storage, push notifications, and family synchronization, so chat messages, shopping lists, appointments, and family information stay up to date across devices."
      },
      card4: {
        title: "Rentara",
        copy: "The digital operating system for modern property management, from damage reports to service-charge billing.",
        description:
          "Rentara is a fully integrated platform for property managers, housing companies, and real estate businesses. It digitizes central property-management processes, from damage reports and contractor assignments to invoice review, contract management, and service-charge billing. Instead of combining separate tools, emails, spreadsheets, and paper processes, Rentara brings workflows into one app for managers, tenants, and contractors. Tenants can report damage directly in the app with photos, descriptions, and automatic unit assignment. Each report enters a central ticket system. Managers see open, active, and completed cases in a dashboard, prioritize tickets, comment, and assign contractors. Contractors receive jobs directly in their app, suggest appointments, post status updates, and upload invoices as PDFs. Invoices can be reviewed, approved, rejected with a reason, and exported for accounting, for example as DATEV-compatible CSV files or through ERP webhooks. Rentara manages buildings, apartments, tenancies, contract data, devices, sensors, and documents centrally. Service-charge billing, digital twins, maintenance management, QR-code onboarding, white-label capability, and AI support turn it into a complete system for modern real estate operations."
      },
      card5: {
        title: "Next Gen Gym OS",
        copy: "The smart platform for gyms with app-based access, memberships, payments, and studio management.",
        description:
          "Next Gen Gym OS is a digital platform for fitness studios that combines access control, memberships, payments, and studio management in one app. Members open the studio door with their smartphone, while operators keep track of members, occupancy, equipment, and revenue. The app runs on iOS, Android, and web, and adapts to each role automatically. Members see access, membership status, and invoices, studio admins get a full management dashboard, and platform operators can manage multiple studios through a super-admin portal. Access works through Bluetooth Low Energy with live membership checks, secure QR-code fallback, and biometric confirmation. Memberships, plans, payments, plan changes, and cancellations run through Stripe and an integrated customer portal. Operators see active members, check-ins, occupancy, revenue, access logs, equipment status, member management, and analytics. Occupancy updates live through WebSockets. The platform is multi-tenant, scalable, and built with Flutter, NestJS, PostgreSQL, Stripe, Redis, and Sentry."
      },
      card6: {
        title: "Care App",
        copy: "A concept for care, support, documentation, and better coordination in everyday work."
      }
    },
    testimonials: {
      eyebrow: "Testimonials",
      titleA: "Client",
      titleB: "Testimonials",
      copy: "What clients say about working with me",
      selector: "Show testimonial",
      items: [
        {
          name: "Sarah Johnson",
          role: "CEO, TechStart Inc",
          content:
            "Exceptional work! The website delivered exceeded our expectations. Professional, responsive, and delivered on time.",
          image:
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
        },
        {
          name: "Michael Chen",
          role: "Product Manager, InnovateCorp",
          content:
            "Outstanding technical skills and attention to detail. The mobile app development was flawless from start to finish.",
          image:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
        },
        {
          name: "Emily Rodriguez",
          role: "Founder, DesignStudio",
          content:
            "Creative solutions and excellent communication throughout the project. Highly recommended for any web development needs.",
          image:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80"
        },
        {
          name: "David Kim",
          role: "CTO, DataFlow Solutions",
          content:
            "Impressive performance optimization and clean code architecture. The results speak for themselves.",
          image:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80"
        }
      ]
    },
    contact: {
      title: "Let's Create Something Amazing Together",
      copy:
        "Have an app idea, need a stronger digital presence, or want your brand to become more visible? Tell me where you want to go - I will help turn it into a clear concept and a polished result.",
      quote: '"The best way to predict the future is to create it."'
    },
    form: {
      title: "Send me a message",
      name: "Your Name",
      namePlaceholder: "John Doe",
      email: "Email Address",
      emailPlaceholder: "john@example.com",
      message: "Your Message",
      messagePlaceholder: "Tell me about your project and how I can help bring your vision to life...",
      submit: "Send Message",
      sending: "Sending...",
      success: "Thank you, your message has been sent.",
      error: "Something went wrong. Your email app will open now."
    },
    aria: {
      lang: "Switch language",
      theme: "Toggle theme",
      menu: "Open menu",
      top: "Back to top"
    }
  }
};

let currentLang = "de";
let phraseIndex = 0;
let charIndex = 0;
let deleting = false;
let typeTimer;
let testimonialIndex = 0;

function t(path) {
  return path.split(".").reduce((value, key) => value?.[key], translations[currentLang]);
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.title = t("title");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("metaDescription"));

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const value = t(element.dataset.i18n);
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    const value = t(element.dataset.i18nPlaceholder);
    if (typeof value === "string") {
      element.setAttribute("placeholder", value);
    }
  });

  langToggle.setAttribute("aria-label", t("aria.lang"));
  updateThemeLabel();
  menuToggle.setAttribute("aria-label", t("aria.menu"));
  toTop.setAttribute("aria-label", t("aria.top"));

  document.querySelectorAll("[data-lang-label]").forEach(label => {
    label.classList.toggle("active", label.dataset.langLabel === lang);
  });

  resetTypewriter();
  renderTestimonial(testimonialIndex);

  if (serviceModal.classList.contains("open")) {
    const activeService = serviceModal.dataset.activeService;
    renderServiceModal(activeService);
  }
}

function updateThemeLabel() {
  const targetMode = body.classList.contains("dark")
    ? currentLang === "de"
      ? "Hellmodus aktivieren"
      : "Switch to light mode"
    : currentLang === "de"
      ? "Dunkelmodus aktivieren"
      : "Switch to dark mode";
  themeToggle.setAttribute("aria-label", targetMode);
}

function resetTypewriter() {
  window.clearTimeout(typeTimer);
  phraseIndex = 0;
  charIndex = 0;
  deleting = false;
  typed.textContent = "";
  typeLoop();
}

function typeLoop() {
  const phrases = t("hero.phrases");
  const word = phrases[phraseIndex];
  typed.textContent = word.slice(0, charIndex);

  if (!deleting && charIndex < word.length) {
    charIndex += 1;
    typeTimer = setTimeout(typeLoop, 82);
    return;
  }

  if (!deleting && charIndex === word.length) {
    deleting = true;
    typeTimer = setTimeout(typeLoop, 1700);
    return;
  }

  if (deleting && charIndex > 0) {
    charIndex -= 1;
    typeTimer = setTimeout(typeLoop, 38);
    return;
  }

  deleting = false;
  phraseIndex = (phraseIndex + 1) % phrases.length;
  typeTimer = setTimeout(typeLoop, 360);
}

function createParticles() {
  const wrap = document.querySelector(".particles");
  for (let i = 0; i < 42; i += 1) {
    const dot = document.createElement("span");
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.animationDelay = `${Math.random() * 9}s`;
    dot.style.animationDuration = `${7 + Math.random() * 8}s`;
    dot.style.opacity = `${0.25 + Math.random() * 0.55}`;
    wrap.appendChild(dot);
  }
}

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = max > 0 ? (window.scrollY / max) * 100 : 0;
  progress.style.width = `${percentage}%`;
  toTop.classList.toggle("visible", window.scrollY > 360);
}

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal-up, .reveal-left, .reveal-right").forEach(element => {
  revealObserver.observe(element);
});

function renderServiceModal(serviceKey) {
  const service = t(`services.${serviceKey}`);
  if (!service) {
    return;
  }

  serviceModal.dataset.activeService = serviceKey;
  serviceModalEyebrow.textContent = t("services.modalEyebrow");
  serviceModalTitle.textContent = service.title;
  serviceModalClose.setAttribute("aria-label", currentLang === "de" ? "Schließen" : "Close");
  const introParagraphs = service.detailIntro || [service.intro];
  const detailSections =
    service.detailSections || [{ title: service.itemsTitle, items: service.items }];
  const closingParagraphs = service.detailClosing || [service.closing];

  serviceModalContent.innerHTML = `
    ${introParagraphs.map(paragraph => `<p>${paragraph}</p>`).join("")}
    ${detailSections
      .map(
        section => `
          <h3>${section.title}</h3>
          <ul>${section.items
            .map(item =>
              typeof item === "string"
                ? `<li>${item}</li>`
                : `<li><strong>${item.title}</strong><span>${item.text}</span></li>`
            )
            .join("")}</ul>
        `
      )
      .join("")}
    ${closingParagraphs.map(paragraph => `<p>${paragraph}</p>`).join("")}
  `;
}

function openServiceModal(serviceKey) {
  renderServiceModal(serviceKey);
  serviceModal.classList.add("open");
  serviceModal.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
  serviceModalClose.focus();
}

function closeServiceModal() {
  serviceModal.classList.remove("open");
  serviceModal.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
}

document.querySelectorAll(".service-card").forEach(card => {
  card.addEventListener("click", () => openServiceModal(card.dataset.service));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openServiceModal(card.dataset.service);
    }
  });
});

document.querySelectorAll("[data-service-close]").forEach(element => {
  element.addEventListener("click", closeServiceModal);
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape" && serviceModal.classList.contains("open")) {
    closeServiceModal();
  }
});

const quote = document.querySelector("#quote");
const quoteName = document.querySelector("#quote-name");
const quoteRole = document.querySelector("#quote-role");
const quoteImg = document.querySelector("#quote-img");
const dots = document.querySelector(".dots");

function renderTestimonial(index) {
  const testimonials = t("testimonials.items");
  testimonialIndex = index % testimonials.length;
  const item = testimonials[testimonialIndex];
  quote.textContent = item.content;
  quoteName.textContent = item.name;
  quoteRole.textContent = item.role;
  quoteImg.src = item.image;
  dots.querySelectorAll("button").forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === testimonialIndex);
    button.setAttribute("aria-label", `${t("testimonials.selector")} ${buttonIndex + 1}`);
  });
}

const testimonialSection = document.querySelector('#testimonials');
if (testimonialSection && !testimonialSection.hidden) {
  t("testimonials.items").forEach((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.addEventListener("click", () => renderTestimonial(index));
    dots.appendChild(button);
  });

  setInterval(() => {
    renderTestimonial(testimonialIndex + 1);
  }, 5000);
}

menuToggle.addEventListener("click", () => {
  body.classList.toggle("menu-open");
  mobileMenu.setAttribute("aria-hidden", String(!body.classList.contains("menu-open")));
});

mobileMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    body.classList.remove("menu-open");
    mobileMenu.setAttribute("aria-hidden", "true");
  });
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", event => {
    const href = link.getAttribute("href");
    if (href === "#") return;
    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", window.location.pathname + window.location.search);
  });
});

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  updateThemeLabel();
});

langToggle.addEventListener("click", () => {
  applyLanguage(currentLang === "de" ? "en" : "de");
});

toTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const openMailFallback = (name, email, message) => {
  const subject = encodeURIComponent(`Neue Anfrage von ${name || "riccardopopp.de"}`);
  const body = encodeURIComponent(
    `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${message}`
  );
  window.location.href = `mailto:info@riccardopopp.de?subject=${subject}&body=${body}`;
};

document.querySelector(".contact-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = formData.get("name")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim() || "";
  const message = formData.get("message")?.toString().trim() || "";
  const button = form.querySelector("button");
  const status = form.querySelector(".form-status");
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = t("form.sending");

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json"
      }
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Form submission failed");
    }

    form.reset();
    status.textContent = t("form.success");
    status.classList.remove("is-error");
    status.classList.add("is-success");
  } catch (error) {
    status.textContent = t("form.error");
    status.classList.remove("is-success");
    status.classList.add("is-error");
    openMailFallback(name, email, message);
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
});

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", updateScroll);
window.addEventListener("load", () => {
  forceTop();
});
window.addEventListener("pageshow", event => {
  if (event.persisted) {
    forceTop();
  }
});

function detectInitialLang() {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  if (langParam === 'en' || langParam === 'de') return langParam;
  const saved = localStorage.getItem('lang');
  if (saved === 'en' || saved === 'de') return saved;
  return (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'de';
}

document.querySelectorAll('.project-card').forEach(card => {
  const link = card.querySelector('.project-overlay a');
  if (!link || !link.getAttribute('href') || link.getAttribute('href') === '#') return;
  card.style.cursor = 'pointer';
  card.addEventListener('click', event => {
    if (event.target.closest('a')) return;
    window.location.href = link.getAttribute('href');
  });
});

createParticles();
applyLanguage(detectInitialLang());
forceTop();
updateScroll();
