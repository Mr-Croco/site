export function buildSeo({ title, description, url, ogImage }) {
  return {
    title,
    description,
    url,
    ogImage,
  };
}

export function buildOrganizationJsonLd({ globals, siteUrl }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: globals.brandName,
    url: siteUrl,
    areaServed: ["Красноярск", "Красноярский край"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: globals.contacts.phone,
        contactType: "sales",
        areaServed: ["Красноярск", "Красноярский край"],
        availableLanguage: ["ru"],
      },
    ],
    sameAs: [globals.contacts.telegram, globals.contacts.whatsapp],
  };
}

export function buildFaqJsonLd({ items }) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
