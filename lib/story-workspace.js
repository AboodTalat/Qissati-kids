/**
 * Keep the story-generation bench on this browser, scoped to one order.
 *
 * The pasted story can be several kilobytes, but it is still ordinary text and
 * comfortably belongs in localStorage. Artwork does not: generated images stay
 * as production files on disk and BookStudio mirrors their blobs to IndexedDB.
 *
 * One record owns both OrderPanel's fields and PromptStudio's workflow. Saves
 * merge at the top level so either component can update its half without
 * erasing the other half.
 */

const VERSION = 1;
const LENGTHS = new Set(["short", "medium", "long"]);
const KEY = (reference) => `qissati.story-workspace.${reference}`;

const emptyWorkflow = () => ({
  conceptApproved: false,
  legacyPetDescription: "",
  reviewChecks: {},
  downloadedProofId: "",
  parentApproved: false,
  referencesApproved: false,
});

function normalise(value) {
  const source = value && typeof value === "object" ? value : {};
  const workflowSource =
    source.workflow && typeof source.workflow === "object" ? source.workflow : {};
  const checksSource =
    workflowSource.reviewChecks && typeof workflowSource.reviewChecks === "object"
      ? workflowSource.reviewChecks
      : {};

  return {
    version: VERSION,
    raw: typeof source.raw === "string" ? source.raw : "",
    length: LENGTHS.has(source.length) ? source.length : "medium",
    workflow: {
      ...emptyWorkflow(),
      conceptApproved: Boolean(workflowSource.conceptApproved),
      legacyPetDescription:
        typeof workflowSource.legacyPetDescription === "string"
          ? workflowSource.legacyPetDescription
          : "",
      reviewChecks: Object.fromEntries(
        Object.entries(checksSource).map(([key, checked]) => [key, Boolean(checked)])
      ),
      downloadedProofId:
        typeof workflowSource.downloadedProofId === "string"
          ? workflowSource.downloadedProofId
          : "",
      parentApproved: Boolean(workflowSource.parentApproved),
      referencesApproved: Boolean(workflowSource.referencesApproved),
    },
  };
}

export function loadStoryWorkspace(reference) {
  if (!reference || typeof window === "undefined") return normalise(null);
  try {
    const raw = window.localStorage.getItem(KEY(reference));
    return normalise(raw ? JSON.parse(raw) : null);
  } catch {
    // Private mode, quota failures and obsolete data must not break the admin.
    return normalise(null);
  }
}

export function saveStoryWorkspace(reference, patch) {
  if (!reference || typeof window === "undefined") return;
  try {
    const current = loadStoryWorkspace(reference);
    const next = normalise({
      ...current,
      ...patch,
      workflow: patch?.workflow
        ? { ...current.workflow, ...patch.workflow }
        : current.workflow,
    });
    window.localStorage.setItem(KEY(reference), JSON.stringify(next));
  } catch {
    // The live editor still works when storage is unavailable.
  }
}

export function clearStoryWorkspace(reference) {
  if (!reference || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY(reference));
  } catch {
    /* see above */
  }
}
