<!--
  NotificationPreferences — settings UI for notification preferences.
  Props:
    - preferences: NotificationPreference[]
    - onUpdate: callback when user changes a preference
-->
<script lang="ts">
	import type { NotificationPreference, NotificationType } from '$types';
	import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_DESCRIPTIONS } from '$types';

	export let preferences: NotificationPreference[] = [];
	export let onUpdate: ((type: NotificationType, field: string, value: boolean | number) => void) | undefined = undefined;
	export let loading: boolean = false;

	function handleToggle(type: NotificationType, field: 'in_app' | 'email', current: boolean) {
		onUpdate?.(type, field, !current);
	}

	function handleDaysChange(type: NotificationType, event: Event) {
		const target = event.target as HTMLSelectElement;
		onUpdate?.(type, 'days_before_deadline', Number(target.value));
	}

	$: sortedPreferences = [...preferences].sort((a, b) =>
		a.notification_type.localeCompare(b.notification_type)
	);

	const dayOptions = [1, 2, 3, 5, 7, 10, 14];
</script>

<div class="preferences-panel">
	<h3>Notificatie-instellingen</h3>
	<p class="description">
		Bepaal per type melding of je in-app en/of per e-mail genotificeerd wilt worden.
	</p>

	<div class="preferences-grid" class:loading>
		<div class="grid-header">
			<span class="col-type">Type</span>
			<span class="col-toggle">In-app</span>
			<span class="col-toggle">E-mail</span>
			<span class="col-days">Dagen vooraf</span>
		</div>

		{#each sortedPreferences as pref (pref.id)}
			<div class="preference-row">
				<div class="col-type">
					<span class="type-name">{NOTIFICATION_TYPE_LABELS[pref.notification_type]}</span>
					<span class="type-desc">{NOTIFICATION_TYPE_DESCRIPTIONS[pref.notification_type]}</span>
				</div>

				<div class="col-toggle">
					<label class="toggle" aria-label="In-app notificatie voor {NOTIFICATION_TYPE_LABELS[pref.notification_type]}">
						<input
							type="checkbox"
							checked={pref.in_app}
							on:change={() => handleToggle(pref.notification_type, 'in_app', pref.in_app)}
							disabled={loading}
						/>
						<span class="toggle-slider"></span>
					</label>
				</div>

				<div class="col-toggle">
					<label class="toggle" aria-label="E-mail notificatie voor {NOTIFICATION_TYPE_LABELS[pref.notification_type]}">
						<input
							type="checkbox"
							checked={pref.email}
							on:change={() => handleToggle(pref.notification_type, 'email', pref.email)}
							disabled={loading}
						/>
						<span class="toggle-slider"></span>
					</label>
				</div>

				<div class="col-days">
					{#if pref.notification_type === 'deadline_approaching'}
						<select
							value={pref.days_before_deadline}
							on:change={(e) => handleDaysChange(pref.notification_type, e)}
							disabled={loading}
							aria-label="Dagen voor deadline waarschuwen"
						>
							{#each dayOptions as d}
								<option value={d}>{d} {d === 1 ? 'dag' : 'dagen'}</option>
							{/each}
						</select>
					{:else}
						<span class="na">—</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.preferences-panel {
		padding: 1.5rem 0;
	}

	.preferences-panel h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.25rem;
	}

	.description {
		font-size: 0.8125rem;
		color: var(--color-text-secondary, #64748b);
		margin: 0 0 1.5rem;
	}

	.preferences-grid {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.preferences-grid.loading {
		opacity: 0.6;
		pointer-events: none;
	}

	.grid-header {
		display: grid;
		grid-template-columns: 1fr 5rem 5rem 8rem;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-bg-muted, #f8fafc);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.preference-row {
		display: grid;
		grid-template-columns: 1fr 5rem 5rem 8rem;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		align-items: center;
		border-top: 1px solid var(--color-border-light, #f1f5f9);
	}

	.col-type {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.type-name {
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.type-desc {
		font-size: 0.6875rem;
		color: var(--color-text-muted, #94a3b8);
	}

	.col-toggle {
		display: flex;
		justify-content: center;
	}

	.col-days {
		display: flex;
		justify-content: center;
	}

	.col-days select {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.25rem;
		background: white;
	}

	.na {
		color: var(--color-text-muted, #94a3b8);
		font-size: 0.8125rem;
	}

	.toggle {
		position: relative;
		display: inline-block;
		width: 2.25rem;
		height: 1.25rem;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		inset: 0;
		background-color: var(--color-bg-muted, #cbd5e1);
		border-radius: 9999px;
		transition: background-color 0.2s;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		height: 0.875rem;
		width: 0.875rem;
		left: 0.1875rem;
		bottom: 0.1875rem;
		background-color: white;
		border-radius: 50%;
		transition: transform 0.2s;
	}

	.toggle input:checked + .toggle-slider {
		background-color: var(--color-primary, #3b82f6);
	}

	.toggle input:checked + .toggle-slider::before {
		transform: translateX(1rem);
	}

	.toggle input:disabled + .toggle-slider {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
