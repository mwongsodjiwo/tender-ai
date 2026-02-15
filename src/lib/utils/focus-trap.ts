const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
		.filter((el) => el.offsetParent !== null);
}

/**
 * Creates a focus trap within the given container element.
 * Returns a destroy function to remove event listeners.
 */
export function createFocusTrap(container: HTMLElement): { destroy: () => void } {
	const previouslyFocused = document.activeElement as HTMLElement | null;

	function focusFirst(): void {
		const elements = getFocusableElements(container);
		if (elements.length > 0) {
			elements[0].focus();
		}
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Tab') return;

		const elements = getFocusableElements(container);
		if (elements.length === 0) return;

		const first = elements[0];
		const last = elements[elements.length - 1];

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	container.addEventListener('keydown', handleKeydown);
	// Focus the first focusable element on next tick
	requestAnimationFrame(focusFirst);

	return {
		destroy() {
			container.removeEventListener('keydown', handleKeydown);
			previouslyFocused?.focus();
		}
	};
}

/**
 * Svelte action for focus trapping.
 * Usage: <div use:focusTrap>...</div>
 * Or conditionally: <div use:focusTrap={active}>...</div>
 */
export function focusTrap(
	node: HTMLElement,
	active: boolean = true
): { update: (active: boolean) => void; destroy: () => void } {
	let trap: { destroy: () => void } | null = null;

	function activate(): void {
		if (!trap) trap = createFocusTrap(node);
	}

	function deactivate(): void {
		if (trap) {
			trap.destroy();
			trap = null;
		}
	}

	if (active) activate();

	return {
		update(newActive: boolean) {
			if (newActive && !trap) activate();
			else if (!newActive && trap) deactivate();
		},
		destroy() {
			deactivate();
		}
	};
}
