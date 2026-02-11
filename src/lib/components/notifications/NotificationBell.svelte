<!--
  NotificationBell — bell icon with unread badge and dropdown.
  Props:
    - unreadCount: number of unread notifications
    - notifications: recent notification list
    - onMarkAllRead: callback to mark all as read
    - onViewAll: callback to navigate to full list
-->
<script lang="ts">
	import type { Notification } from '$types';
	import { NOTIFICATION_TYPE_LABELS } from '$types';
	import NotificationList from './NotificationList.svelte';

	export let unreadCount: number = 0;
	export let notifications: Notification[] = [];
	export let onMarkAllRead: (() => void) | undefined = undefined;
	export let onViewAll: (() => void) | undefined = undefined;
	export let onNotificationClick: ((n: Notification) => void) | undefined = undefined;

	let isOpen = false;

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.notification-bell-wrapper')) {
			isOpen = false;
		}
	}

	function handleMarkAllRead() {
		onMarkAllRead?.();
	}

	function handleViewAll() {
		isOpen = false;
		onViewAll?.();
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="notification-bell-wrapper">
	<button
		class="notification-bell"
		aria-label="Notificaties ({unreadCount} ongelezen)"
		on:click|stopPropagation={toggleDropdown}
	>
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
			stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
			<path d="M13.73 21a2 2 0 0 1-3.46 0" />
		</svg>
		{#if unreadCount > 0}
			<span class="badge" aria-hidden="true">
				{unreadCount > 99 ? '99+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if isOpen}
		<div class="notification-dropdown" role="dialog" aria-label="Notificaties">
			<div class="dropdown-header">
				<h3>Notificaties</h3>
				{#if unreadCount > 0}
					<button class="mark-all-btn" on:click={handleMarkAllRead}>
						Alles gelezen
					</button>
				{/if}
			</div>

			<NotificationList
				{notifications}
				compact={true}
				{onNotificationClick}
			/>

			<div class="dropdown-footer">
				<button class="view-all-btn" on:click={handleViewAll}>
					Alle notificaties bekijken
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.notification-bell-wrapper {
		position: relative;
	}

	.notification-bell {
		position: relative;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: var(--color-text-secondary, #64748b);
		border-radius: 0.375rem;
		transition: background-color 0.15s;
	}

	.notification-bell:hover {
		background-color: var(--color-bg-hover, #f1f5f9);
		color: var(--color-text-primary, #1e293b);
	}

	.badge {
		position: absolute;
		top: 0;
		right: 0;
		background: var(--color-danger, #ef4444);
		color: white;
		font-size: 0.625rem;
		font-weight: 700;
		min-width: 1rem;
		height: 1rem;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.25rem;
		line-height: 1;
	}

	.notification-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		width: 22rem;
		max-height: 28rem;
		overflow-y: auto;
		background: var(--color-bg-surface, white);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
		z-index: 50;
	}

	.dropdown-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #e2e8f0);
	}

	.dropdown-header h3 {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0;
	}

	.mark-all-btn {
		font-size: 0.75rem;
		color: var(--color-primary, #3b82f6);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.mark-all-btn:hover {
		text-decoration: underline;
	}

	.dropdown-footer {
		padding: 0.5rem 1rem;
		border-top: 1px solid var(--color-border, #e2e8f0);
		text-align: center;
	}

	.view-all-btn {
		font-size: 0.75rem;
		color: var(--color-primary, #3b82f6);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		width: 100%;
	}

	.view-all-btn:hover {
		text-decoration: underline;
	}
</style>
