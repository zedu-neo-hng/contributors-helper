/**
 * The ingest cleaner's typed surface. The rules themselves live in `cleanText.mjs`, which
 * `scripts/clean-transcripts.mjs` imports with plain `node` so the corpus and an uploaded capture
 * are cleaned by one rulebook rather than two copies that drift.
 *
 * `cleanTranscriptText` dispatches: caption captures get the corpus shaping (reflowed paragraphs,
 * speaker turns), and anything else keeps its own layout. See `cleanText.mjs` for the rules and
 * `looksLikeCaptionCapture` for how the two are told apart.
 */
export {
  captionSections,
  cleanCaptionText,
  cleanDocumentText,
  cleanTranscriptText,
  looksLikeCaptionCapture,
} from "./cleanText.mjs";
