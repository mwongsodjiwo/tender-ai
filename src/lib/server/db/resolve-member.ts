// Resolve person data from organization_members + profiles — Fase 30
// Used to auto-fill document role person_* fields from a linked member

import type { SupabaseClient } from '@supabase/supabase-js';

/** Person fields extracted from a member's profile */
export interface MemberPersonData {
	person_name: string;
	person_email: string;
	person_phone: string | null;
	person_function: string | null;
}

/** Looks up a member by ID and returns their person data from profiles */
export async function resolveMemberPersonData(
	supabase: SupabaseClient,
	memberId: string
): Promise<MemberPersonData | null> {
	const { data, error } = await supabase
		.from('organization_members')
		.select('profiles(first_name, last_name, email, phone, job_title)')
		.eq('id', memberId)
		.single();

	if (error || !data?.profiles) {
		return null;
	}

	const profile = data.profiles as unknown as {
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		job_title: string | null;
	};

	return {
		person_name: `${profile.first_name} ${profile.last_name}`.trim(),
		person_email: profile.email,
		person_phone: profile.phone,
		person_function: profile.job_title
	};
}
