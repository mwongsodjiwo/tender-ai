// Briefing agent — re-exports from split modules
// See briefing-prompts.ts (prompt templates) and briefing-processor.ts (processing)

export { conductBriefing, generateArtifacts } from './briefing-processor.js';
export {
	BRIEFING_SYSTEM_PROMPT,
	GENERATION_SYSTEM_PROMPT,
	BRIEFING_COMPLETE_TAG
} from './briefing-prompts.js';
