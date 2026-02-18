// Procedure advice utility — Fase 20
// Advises on procurement procedure based on EU threshold amounts
// Supports services (central/decentral), works, and social services

import type { OrganizationSettings } from '$types/db/multi-org';
import type { ProcedureType } from '$types/enums';
import type { ContractingAuthorityType } from '$types/enums';

/** Category types for threshold comparison */
export const CATEGORY_TYPES = [
	'diensten',
	'werken',
	'sociaal'
] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

/** Result of procedure advice calculation */
export interface ProcedureAdvice {
	recommended: ProcedureType;
	label: string;
	motivation: string;
	threshold: number;
	isAboveThreshold: boolean;
}

/** Input for deviation detection */
export interface DeviationCheck {
	recommended: ProcedureType;
	chosen: ProcedureType;
	isDeviation: boolean;
	requiresJustification: boolean;
}

/** Default EU thresholds (EUR) per tender2-plan */
const DEFAULT_THRESHOLDS = {
	works: 5538000,
	servicesCentral: 143000,
	servicesDecentral: 221000,
	socialServices: 750000
} as const;

/** Extracts the applicable threshold for a given category */
function getThreshold(
	category: CategoryType,
	authorityType: ContractingAuthorityType,
	settings: ThresholdSettings | null
): number {
	if (category === 'werken') {
		return settings?.threshold_works ?? DEFAULT_THRESHOLDS.works;
	}
	if (category === 'sociaal') {
		return settings?.threshold_social_services
			?? DEFAULT_THRESHOLDS.socialServices;
	}
	// diensten — depends on central/decentral
	if (authorityType === 'centraal') {
		return settings?.threshold_services_central
			?? DEFAULT_THRESHOLDS.servicesCentral;
	}
	return settings?.threshold_services_decentral
		?? DEFAULT_THRESHOLDS.servicesDecentral;
}

/** Threshold-related fields from OrganizationSettings */
type ThresholdSettings = Pick<
	OrganizationSettings,
	| 'threshold_works'
	| 'threshold_services_central'
	| 'threshold_services_decentral'
	| 'threshold_social_services'
>;

/** Returns procedure advice based on amount and thresholds */
export function getProcedureAdvice(
	amount: number,
	category: CategoryType,
	authorityType: ContractingAuthorityType,
	settings: ThresholdSettings | null
): ProcedureAdvice {
	const threshold = getThreshold(category, authorityType, settings);
	const isAboveThreshold = amount >= threshold;

	if (isAboveThreshold && category === 'sociaal') {
		return {
			recommended: 'open',
			label: 'Vereenvoudigd regime',
			motivation: `Bedrag (\u20AC${formatAmount(amount)}) is boven de drempel voor sociale diensten (\u20AC${formatAmount(threshold)}). Een vereenvoudigde procedure is van toepassing.`,
			threshold,
			isAboveThreshold
		};
	}

	if (isAboveThreshold) {
		return {
			recommended: 'open',
			label: 'Europees openbaar',
			motivation: `Bedrag (\u20AC${formatAmount(amount)}) is boven de Europese drempel (\u20AC${formatAmount(threshold)}). Een Europese openbare procedure is vereist.`,
			threshold,
			isAboveThreshold
		};
	}

	return {
		recommended: 'national_open',
		label: 'Meervoudig onderhands / enkelvoudig',
		motivation: `Bedrag (\u20AC${formatAmount(amount)}) is onder de drempel (\u20AC${formatAmount(threshold)}). Een nationale of onderhandse procedure volstaat.`,
		threshold,
		isAboveThreshold
	};
}

/** Checks whether the chosen procedure deviates from advice */
export function checkDeviation(
	recommended: ProcedureType,
	chosen: ProcedureType | null
): DeviationCheck {
	if (!chosen) {
		return {
			recommended,
			chosen: recommended,
			isDeviation: false,
			requiresJustification: false
		};
	}

	const isDeviation = chosen !== recommended;
	return {
		recommended,
		chosen,
		isDeviation,
		requiresJustification: isDeviation
	};
}

/** Formats amount with Dutch locale thousands separator */
function formatAmount(value: number): string {
	return new Intl.NumberFormat('nl-NL', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}
