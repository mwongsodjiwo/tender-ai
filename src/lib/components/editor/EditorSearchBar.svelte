<script lang="ts">
	import { tick, createEventDispatcher } from 'svelte';
	import type { Editor } from '@tiptap/core';
	import type TiptapEditor from '$components/TiptapEditor.svelte';

	export let editorComponents: Record<string, TiptapEditor> = {};
	export let artifacts: { id: string }[] = [];
	export let sectionElements: Record<string, HTMLElement> = {};
	export let hasReplace = true;

	const dispatch = createEventDispatcher<{
		close: void;
		contentChanged: { artifactId: string; content: string };
	}>();

	let searchQuery = '';
	let replaceQuery = '';
	let searchResults: { artifactId: string; from: number; to: number }[] = [];
	let currentSearchResult = -1;
	let searchInput: HTMLInputElement;

	tick().then(() => searchInput?.focus());

	function removeHighlights() {
		if (typeof document === 'undefined') return;
		const marks = document.querySelectorAll('mark.search-highlight');
		marks.forEach((m) => {
			const p = m.parentNode;
			if (p) { p.replaceChild(document.createTextNode(m.textContent ?? ''), m); p.normalize(); }
		});
	}

	function getMatches(ed: Editor, q: string): { from: number; to: number }[] {
		const matches: { from: number; to: number }[] = [];
		const ql = q.toLowerCase();
		ed.state.doc.descendants((node, pos) => {
			if (!node.isText || !node.text) return;
			const lt = node.text.toLowerCase();
			let idx = 0;
			while ((idx = lt.indexOf(ql, idx)) !== -1) {
				matches.push({ from: pos + idx, to: pos + idx + q.length });
				idx += q.length;
			}
		});
		return matches;
	}

	function performSearch() {
		removeHighlights();
		searchResults = [];
		currentSearchResult = -1;
		if (!searchQuery.trim()) return;
		for (const a of artifacts) {
			const ed = editorComponents[a.id]?.getEditor();
			if (!ed) continue;
			for (const m of getMatches(ed, searchQuery.trim())) {
				searchResults.push({ artifactId: a.id, ...m });
			}
		}
		searchResults = searchResults;
		if (searchResults.length > 0) { currentSearchResult = 0; highlightResult(); }
	}

	function highlightResult() {
		removeHighlights();
		if (currentSearchResult < 0 || currentSearchResult >= searchResults.length) return;
		const result = searchResults[currentSearchResult];
		sectionElements[result.artifactId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		editorComponents[result.artifactId]?.getEditor()?.chain().focus().setTextSelection({ from: result.from, to: result.to }).run();
		applyDomHighlights();
	}

	function applyDomHighlights() {
		if (typeof window === 'undefined') return;
		const q = searchQuery.toLowerCase();
		let gi = 0;
		for (const a of artifacts) {
			const ed = editorComponents[a.id]?.getEditor();
			if (!ed) continue;
			const walker = document.createTreeWalker(ed.view.dom, NodeFilter.SHOW_TEXT);
			const nodes: Text[] = [];
			let n: Text | null;
			while ((n = walker.nextNode() as Text | null)) nodes.push(n);
			for (const tn of nodes) {
				const txt = tn.textContent ?? '';
				const lt = txt.toLowerCase();
				let pos = 0; let last = 0;
				const frags: (string | { text: string; cur: boolean })[] = [];
				let has = false;
				while ((pos = lt.indexOf(q, pos)) !== -1) {
					has = true;
					if (pos > last) frags.push(txt.substring(last, pos));
					frags.push({ text: txt.substring(pos, pos + q.length), cur: gi === currentSearchResult });
					last = pos + q.length; gi++; pos += q.length;
				}
				if (has) {
					if (last < txt.length) frags.push(txt.substring(last));
					const parent = tn.parentNode;
					if (!parent) continue;
					const frag = document.createDocumentFragment();
					for (const part of frags) {
						if (typeof part === 'string') { frag.appendChild(document.createTextNode(part)); }
						else {
							const mark = document.createElement('mark');
							mark.className = `search-highlight${part.cur ? ' search-current' : ''}`;
							mark.textContent = part.text;
							frag.appendChild(mark);
						}
					}
					parent.replaceChild(frag, tn);
				}
			}
		}
	}

	function nextResult() { if (searchResults.length === 0) return; currentSearchResult = (currentSearchResult + 1) % searchResults.length; highlightResult(); }
	function prevResult() { if (searchResults.length === 0) return; currentSearchResult = (currentSearchResult - 1 + searchResults.length) % searchResults.length; highlightResult(); }

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) prevResult(); else if (searchResults.length === 0) performSearch(); else nextResult(); }
		if (e.key === 'Escape') close();
	}

	function replaceCurrent() {
		if (!searchQuery.trim() || currentSearchResult < 0 || currentSearchResult >= searchResults.length) return;
		removeHighlights();
		const r = searchResults[currentSearchResult];
		const ed = editorComponents[r.artifactId]?.getEditor();
		if (!ed) return;
		ed.chain().focus().setTextSelection({ from: r.from, to: r.to }).insertContent(replaceQuery).run();
		dispatch('contentChanged', { artifactId: r.artifactId, content: ed.getHTML() });
		const idx = currentSearchResult;
		performSearch();
		if (searchResults.length > 0) { currentSearchResult = Math.min(idx, searchResults.length - 1); highlightResult(); }
	}

	function replaceAll() {
		if (!searchQuery.trim() || searchResults.length === 0) return;
		removeHighlights();
		for (const a of artifacts) {
			const matches = searchResults.filter((r) => r.artifactId === a.id).sort((x, y) => y.from - x.from);
			if (matches.length === 0) continue;
			const ed = editorComponents[a.id]?.getEditor();
			if (!ed) continue;
			for (const m of matches) ed.chain().focus().setTextSelection({ from: m.from, to: m.to }).insertContent(replaceQuery).run();
			dispatch('contentChanged', { artifactId: a.id, content: ed.getHTML() });
		}
		performSearch();
	}

	function close() { removeHighlights(); dispatch('close'); }
</script>

<div class="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-6 py-2">
	<div class="relative flex items-center">
		<svg class="pointer-events-none absolute left-2.5 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
		<input bind:this={searchInput} bind:value={searchQuery} on:keydown={handleKeydown} on:input={performSearch} type="text" placeholder="Zoeken in document..." class="h-8 w-64 rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" aria-label="Zoekterm invoeren" />
	</div>
	{#if hasReplace}
		<input bind:value={replaceQuery} on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) replaceAll(); else replaceCurrent(); } }} type="text" placeholder="Vervangen door..." class="h-8 w-64 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" aria-label="Vervangtekst invoeren" />
	{/if}
	{#if searchResults.length > 0}
		<span class="text-xs text-gray-500">{currentSearchResult + 1} van {searchResults.length}</span>
	{:else if searchQuery.trim()}
		<span class="text-xs text-gray-500">Geen resultaten</span>
	{/if}
	<button on:click={prevResult} class="srch-btn" title="Vorige (Shift+Enter)" aria-label="Vorig resultaat" type="button" disabled={searchResults.length === 0}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg></button>
	<button on:click={nextResult} class="srch-btn" title="Volgende (Enter)" aria-label="Volgend resultaat" type="button" disabled={searchResults.length === 0}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></button>
	{#if hasReplace}
		<button on:click={replaceCurrent} class="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50" type="button" disabled={searchResults.length === 0 || !searchQuery.trim()}>Vervang</button>
		<button on:click={replaceAll} class="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50" type="button" disabled={searchResults.length === 0 || !searchQuery.trim()}>Alles</button>
	{/if}
	<button on:click={close} class="srch-btn" title="Zoeken sluiten" aria-label="Zoeken sluiten" type="button"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
</div>

<style>
	.srch-btn { display: inline-flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; border-radius: 0.375rem; color: #4b5563; transition: all 0.1s; }
	.srch-btn:hover:not(:disabled) { background-color: #f3f4f6; color: #111827; }
	.srch-btn:disabled { opacity: 0.35; cursor: default; }
</style>
