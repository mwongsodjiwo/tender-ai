<!--
  NotificationList — renders a list of notification items.
  Props:
    - notifications: Notification[]
    - compact: boolean (for dropdown vs full page)
    - onNotificationClick: optional callback
-->
<script lang="ts">
	import type { Notification } from '$types';
	import { NOTIFICATION_TYPE_LABELS } from '$types';

	export let notifications: Notification[] = [];
	export let compact: boolean = false;
	export let onNotificationClick: ((n: Notification) => void) | undefined = undefined;

	function formatTimeAgo(dateStr: string): string {
		const now = new Date();
		const date = new Date(dateStr);
		const diffMs = now.getTime() - date.getTime();
		const diffMin = Math.floor(diffMs / 60000);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);

		if (diffMin < 1) return 'Zojuist';
		if (diffMin < 60) return `${diffMin} min geleden`;
		if (diffHour < 24) return `${diffHour} uur geleden`;
		if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'dag' : 'dagen'} geleden`;
		return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
	}

	function getTypeIcon(type: string): string {
		const icons: Record<string, string> = {
			deadline_approaching: '\u23F0',
			deadline_overdue: '\u26A0\uFE0F',
			activity_assigned: '\u{1F4CB}',
			planning_changed: '\u{1F504}',
			milestone_completed: '\u2705',
			overload_warning: '\u{1F525}',
			weekly_summary: '\u{1F4CA}'
		};
		return icons[type] ?? '\u{1F514}';
	}

	function handleClick(notification: Notification) {
		onNotificationClick?.(notification);
	}
</script>

<div class="notification-list" class:compact>
	{#if notifications.length === 0}
		<div class="empty-state">
			<p>Geen notificaties</p>
		</div>
	{:else}
		{#each notifications as notification (notification.id)}
			<button
				class="notification-item"
				class:unread={!notification.is_read}
				on:click={() => handleClick(notification)}
				aria-label="{notification.title} — {notification.is_read ? 'gelezen' : 'ongelezen'}"
			>
				<span class="icon" aria-hidden="true">
					{getTypeIcon(notification.notification_type)}
				</span>
				<div class="content">
					<span class="title">{notification.title}</span>
					{#if !compact}
						<span class="body">{notification.body}</span>
					{/if}
					<span class="meta">
						<span class="type-label">
							{NOTIFICATION_TYPE_LABELS[notification.notification_type]}
						</span>
						<span class="time">{formatTimeAgo(notification.created_at)}</span>
					</span>
				</div>
				{#if !notification.is_read}
					<span class="unread-dot" aria-hidden="true"></span>
				{/if}
			</button>
		{/each}
	{/if}
</div>

<style>
	.notification-list {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		color: var(--color-text-muted, #94a3b8);
		font-size: 0.875rem;
	}

	.notification-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background-color 0.15s;
		border-bottom: 1px solid var(--color-border-light, #f1f5f9);
	}

	.notification-item:hover {
		background-color: var(--color-bg-hover, #f8fafc);
	}

	.notification-item.unread {
		background-color: var(--color-bg-highlight, #eff6ff);
	}

	.compact .notification-item {
		padding: 0.5rem 1rem;
	}

	.icon {
		font-size: 1.25rem;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-primary, #1e293b);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.body {
		font-size: 0.75rem;
		color: var(--color-text-secondary, #64748b);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6875rem;
		color: var(--color-text-muted, #94a3b8);
	}

	.type-label {
		background: var(--color-bg-tag, #f1f5f9);
		padding: 0.0625rem 0.375rem;
		border-radius: 0.25rem;
	}

	.unread-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		background: var(--color-primary, #3b82f6);
		flex-shrink: 0;
		margin-top: 0.375rem;
	}
</style>
