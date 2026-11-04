/** Validate artifact provenance before a privileged workflow publishes static files. */
export function previewPlan(run, artifacts, pr) {
  if (run.event !== "pull_request" || run.conclusion !== "success") return null;
  const candidates = artifacts.filter(artifact => /^preview-pr-[1-9][0-9]*$/.test(artifact.name) && !artifact.expired);
  if (candidates.length !== 1) throw new Error("Expected exactly one preview artifact");
  const artifact = candidates[0];
  const number = Number(artifact.name.slice("preview-pr-".length));
  if (number !== pr.number || !Number.isSafeInteger(number)) throw new Error("Artifact does not match PR");
  if (pr.state !== "open" || pr.head.sha !== run.head_sha) return null;
  if (!pr.head.repo || pr.head.repo.full_name !== run.head_repository?.full_name) throw new Error("Repository mismatch");
  return { number, artifactId: artifact.id };
}
