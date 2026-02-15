import { z } from 'zod';
import { NOTIFICATION_TYPES } from '$types';

// =============================================================================
// NOTIFICATIONS — Sprint 8
// =============================================================================

export const notificationListQuerySchema = z.object({
	unread_only: z.coerce.boolean().optional().default(false),
	project_id: z.string().uuid('Ongeldig project-ID').optional(),
	notification_type: z.enum(NOTIFICATION_TYPES, {
		errorMap: () => ({ message: 'Ongeldig notificatietype' })
	}).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional().default(20),
	offset: z.coerce.number().int().min(0).optional().default(0)
});

export const markNotificationsReadSchema = z.object({
	notification_ids: z.array(z.string().uuid('Ongeldig notificatie-ID'))
		.min(1, 'Minimaal één notificatie-ID vereist')
		.max(100, 'Maximaal 100 notificaties tegelijk')
});

export const updateNotificationPreferenceSchema = z.object({
	notification_type: z.enum(NOTIFICATION_TYPES, {
		errorMap: () => ({ message: 'Ongeldig notificatietype' })
	}),
	in_app: z.boolean().optional(),
	email: z.boolean().optional(),
	days_before_deadline: z.number().int().min(1).max(30).optional()
});
