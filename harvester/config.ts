// TenderNed harvester configuration

export const HARVESTER_CONFIG = {
	/** TenderNed API base URL */
	baseUrl: 'https://www.tenderned.nl/papi/tenderned-rs-tns/v2',

	/** Maximum number of items to fetch per request */
	pageSize: 50,

	/** Maximum total items to harvest per run */
	maxItemsPerRun: 500,

	/** Delay between API requests in ms to avoid rate limiting */
	requestDelayMs: 1000,

	/** Maximum age of items to harvest (days) */
	maxAgeDays: 365,

	/** Chunk size for text splitting (characters) */
	chunkSize: 1000,

	/** Chunk overlap (characters) */
	chunkOverlap: 200,

	/** Supported CPV code prefixes for filtering */
	relevantCpvPrefixes: [
		'45', // Construction work
		'50', // Repair and maintenance
		'71', // Architectural, engineering services
		'72', // IT services
		'79', // Business services
		'80', // Education
		'85', // Health services
		'90'  // Sewage, refuse, cleaning
	]
} as const;

export type HarvesterConfig = typeof HARVESTER_CONFIG;
