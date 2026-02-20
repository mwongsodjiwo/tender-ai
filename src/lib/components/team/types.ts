import type { ProjectRole } from '$lib/types/enums.js';

export interface TeamMember {
	id: string;
	profile: {
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		job_title: string | null;
	};
	roles: { role: ProjectRole }[];
}
