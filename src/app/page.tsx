import content from "../../content/content.json";

// Placeholder for the proper site: reads the same content.json as the Artifact.
export default function Home() {
  const c = content;
  return (
    <main className="mx-auto max-w-2xl p-6">
      <p lang="fa" dir="rtl" className="text-7xl font-bold">{c.name.fa}</p>
      <h1 className="text-4xl font-bold">{c.name.en}</h1>
      <p className="mt-2 text-lg opacity-70">{c.tagline}.</p>
      <h2 className="mt-8 text-2xl font-semibold">History</h2>
      <ul className="mt-2 list-disc pl-5">
        {c.history.map((h) => (
          <li key={h.text}>{h.text}</li>
        ))}
      </ul>
      <h2 className="mt-8 text-2xl font-semibold">Places to see</h2>
      {c.landmarks.map((l) => (
        <p key={l.name} className="mt-2"><b>{l.name}.</b> {l.text}</p>
      ))}
    </main>
  );
}
