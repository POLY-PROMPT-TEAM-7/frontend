import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <main className="grid min-h-[calc(100vh-3rem)] place-items-center">
      <div className="w-full max-w-5xl space-y-6">
        <Badge tone="accent">Offline Demo Ready</Badge>
        <section className="grid gap-6 lg:grid-cols-[1.25fr,1fr]">
          <Card className="p-6" title="KG Study Tool" subtitle="From scattered PDFs to connected knowledge.">
            <p className="text-sm text-[var(--color-text-muted)]">
              Upload class materials, extract a concept graph, then explore relationships with confidence and source context.
              The app is designed to run fully offline for demo reliability.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/app">
                <Button>Open Demo App</Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary">About & Ethics</Button>
              </Link>
            </div>
          </Card>
          <Card title="Wave 1 Foundation" subtitle="UI shell and backend contract setup">
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>Strict TypeScript API + graph models</li>
              <li>Zustand app state machine</li>
              <li>Proxy-ready route architecture</li>
              <li>FastAPI deterministic stub + docker compose</li>
            </ul>
          </Card>
        </section>
      </div>
    </main>
  );
}
