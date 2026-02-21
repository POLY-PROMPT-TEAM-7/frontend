import { Card } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <main className="space-y-4">
      <Card title="Responsible Use" subtitle="How this demo should be used">
        <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--color-text-muted)]">
          <li>Use this tool to improve understanding, not to bypass learning.</li>
          <li>Do not upload sensitive or private materials in real deployments.</li>
          <li>Always verify extracted relationships against original sources.</li>
        </ul>
      </Card>

      <Card title="Privacy" subtitle="Demo behavior">
        <p className="text-sm text-[var(--color-text-muted)]">
          This demo runs with a local stub service and local demo data. Uploaded demo files are transient and are not
          intended for persistent storage.
        </p>
      </Card>

      <Card title="Limitations" subtitle="Model and extraction caveats">
        <p className="text-sm text-[var(--color-text-muted)]">
          AI extraction can produce incomplete or incorrect relationships. Confidence values and source references are
          included to help you judge reliability.
        </p>
      </Card>
    </main>
  );
}
