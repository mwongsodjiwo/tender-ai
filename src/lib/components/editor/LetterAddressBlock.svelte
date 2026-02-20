<script lang="ts">
	export let senderName = '';
	export let senderStreet = '';
	export let senderPostalCode = '';
	export let senderCity = '';

	export let recipientName = '';
	export let recipientStreet = '';
	export let recipientPostalCode = '';
	export let recipientCity = '';

	export let date = '';
	export let reference = '';
	export let subject = '';
	export let editable = true;

	// Format today's date in Dutch if no date provided
	$: displayDate = date || new Date().toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
</script>

<div class="letter-address-block">
	<!-- Sender (top-left) -->
	<div class="sender-block">
		<input
			type="text"
			bind:value={senderName}
			disabled={!editable}
			class="address-input font-semibold"
			placeholder="Naam organisatie"
		/>
		<input
			type="text"
			bind:value={senderStreet}
			disabled={!editable}
			class="address-input"
			placeholder="Straat en huisnummer"
		/>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={senderPostalCode}
				disabled={!editable}
				class="address-input w-24"
				placeholder="Postcode"
			/>
			<input
				type="text"
				bind:value={senderCity}
				disabled={!editable}
				class="address-input flex-1"
				placeholder="Plaats"
			/>
		</div>
	</div>

	<!-- Recipient (right-aligned) -->
	<div class="recipient-block">
		<input
			type="text"
			bind:value={recipientName}
			disabled={!editable}
			class="address-input text-right font-semibold"
			placeholder="Naam ontvanger"
		/>
		<input
			type="text"
			bind:value={recipientStreet}
			disabled={!editable}
			class="address-input text-right"
			placeholder="Straat en huisnummer"
		/>
		<div class="flex justify-end gap-2">
			<input
				type="text"
				bind:value={recipientPostalCode}
				disabled={!editable}
				class="address-input w-24 text-right"
				placeholder="Postcode"
			/>
			<input
				type="text"
				bind:value={recipientCity}
				disabled={!editable}
				class="address-input w-40 text-right"
				placeholder="Plaats"
			/>
		</div>
	</div>

	<!-- Date and reference row -->
	<div class="meta-row">
		<div class="flex items-baseline gap-2">
			<span class="meta-label">Datum:</span>
			<input
				type="text"
				bind:value={displayDate}
				disabled={!editable}
				class="address-input"
				placeholder="Datum"
			/>
		</div>
		<div class="flex items-baseline gap-2">
			<span class="meta-label">Kenmerk:</span>
			<input
				type="text"
				bind:value={reference}
				disabled={!editable}
				class="address-input"
				placeholder="Referentienummer"
			/>
		</div>
	</div>

	<!-- Subject line -->
	<div class="subject-row">
		<span class="meta-label">Betreft:</span>
		<input
			type="text"
			bind:value={subject}
			disabled={!editable}
			class="address-input flex-1 font-semibold"
			placeholder="Onderwerp van de brief"
		/>
	</div>
</div>

<style>
	.letter-address-block {
		padding: 0 0 1.5rem 0;
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 1.5rem;
		font-family: 'Asap', sans-serif;
		font-size: var(--editor-font-size, 11pt);
		line-height: 1.6;
		color: #1a1a1a;
	}

	.sender-block {
		margin-bottom: 2rem;
	}

	.recipient-block {
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.meta-row {
		display: flex;
		gap: 3rem;
		margin-bottom: 1rem;
	}

	.subject-row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.meta-label {
		font-size: inherit;
		color: #6b7280;
		white-space: nowrap;
	}

	.address-input {
		background: transparent;
		border: none;
		border-bottom: 1px solid transparent;
		padding: 0.125rem 0.25rem;
		font-size: inherit;
		font-family: inherit;
		line-height: inherit;
		color: #1a1a1a;
		outline: none;
		width: 100%;
		transition: border-color 0.15s;
	}

	.address-input:hover:not(:disabled) {
		border-bottom-color: #d1d5db;
	}

	.address-input:focus:not(:disabled) {
		border-bottom-color: #3b82f6;
	}

	.address-input:disabled {
		color: #374151;
		cursor: default;
	}

	.address-input::placeholder {
		color: #9ca3af;
		font-style: italic;
	}
</style>
