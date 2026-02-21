import Link from "next/link";

import { LandingGraphPreview } from "@/components/LandingGraphPreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <main className="grid min-h-[calc(100vh-3rem)] place-items-center">
      <div className="w-full max-w-5xl space-y-6">
        <Badge tone="accent">Offline Demo Ready</Badge>
        <section className="grid min-w-0 gap-6 lg:grid-cols-[1.25fr,1fr]">
          <Card className="min-w-0 p-6" title="KG Study Tool" subtitle="From scattered PDFs to connected knowledge.">
            <p className="text-sm text-[var(--color-text-muted)]">
              Upload class materials, extract a concept graph, then explore relationships with confidence and source context.
              The app is designed to run fully offline for demo reliability.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/app">
                <Button>Upload materials</Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary">About & Ethics</Button>
              </Link>
            </div>
          </Card>
          <Card className="min-w-0" title="Live Preview" subtitle="Connected learning structure at a glance">
            <LandingGraphPreview />
          </Card>
        </section>
      </div>
    </main>
  );
}
