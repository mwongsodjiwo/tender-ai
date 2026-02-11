<script lang="ts">
	import { tick } from 'svelte';
	import { Editor } from '@tiptap/core';
	import TiptapEditor from '$components/TiptapEditor.svelte';
	import StepperSidebar from '$lib/components/StepperSidebar.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import {
		CONTRACT_TYPE_LABELS,
		GENERAL_CONDITIONS_LABELS,
		GENERAL_CONDITIONS_DESCRIPTIONS
	} from '$types';
	import type { ContractType, GeneralConditionsType } from '$types';
	import type { PageData } from './$types';

	export let data: PageData;

	// Reactive data
	$: project = data.project;
	$: documentType = data.documentType;
	$: artifacts = data.artifacts;
	$: templateSections = data.templateSections as { key: string; title: string; description: string }[];

	// Current section index (for stepper highlight and sidebar context)
	let currentSectionIndex = 0;
	$: activeArtifact = artifacts[currentSectionIndex] ?? null;

	// Template section info
	function getSectionDescription(sectionKey: string): string {
		if (!templateSections) return '';
		const template = templateSections.find((s) => s.key === sectionKey);
		return template?.description ?? '';
	}

	// Per-section editor content tracking
	let sectionContents: Record<string, string> = {};
	let sectionSavedContents: Record<string, string> = {};

	// Initialize from data
	$: {
		for (const artifact of artifacts) {
			if (!(artifact.id in sectionContents)) {
				sectionContents[artifact.id] = artifact.content ?? '';
				sectionSavedContents[artifact.id] = artifact.content ?? '';
			}
		}
	}

	// Track overall unsaved changes
	$: hasChanges = artifacts.some(
		(a) => (sectionContents[a.id] ?? '') !== (sectionSavedContents[a.id] ?? '')
	);

	let saving = false;
	let saveMessage = '';

	// AI generation state (used by AI rewrite via avatar)
	let generateError = '';

	// Chat state
	let conversationId = data.conversationId;
	let chatMessages = [...(data.chatMessages ?? [])];
	let chatInput = '';
	let chatLoading = false;
	let chatContainer: HTMLElement;

	// Right sidebar tab & visibility
	type SidebarTab = 'fields' | 'comments';
	let sidebarTab: SidebarTab = 'comments';
	let showRightSidebar = false;

	function toggleCommentsSidebar() {
		if (showRightSidebar && sidebarTab === 'comments') {
			showRightSidebar = false;
		} else {
			showRightSidebar = true;
			sidebarTab = 'comments';
		}
	}

	// Contract settings
	let contractType: ContractType | null = (data.project?.contract_type as ContractType) ?? null;
	let generalConditions: GeneralConditionsType | null = (data.project?.general_conditions as GeneralConditionsType) ?? null;
	let settingsSaving = false;

	async function saveSettings() {
		settingsSaving = true;
		await fetch(`/api/projects/${project.id}/contract/settings`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contract_type: contractType,
				general_conditions: generalConditions
			})
		});
		settingsSaving = false;
	}

	// ── Comments/annotations state ──
	interface DocumentComment {
		id: string;
		artifact_id: string;
		selected_text: string;
		comment_text: string;
		resolved: boolean;
		created_by: string;
		created_at: string;
		author?: { first_name: string; last_name: string; email: string };
	}

	let comments: DocumentComment[] = [];
	let showCommentInput = false;
	let newCommentText = '';
	let pendingCommentSelection: { artifactId: string; text: string; from: number; to: number } | null = null;
	let commentPopup: { x: number; y: number; visible: boolean } = { x: 0, y: 0, visible: false };
	let activeCommentId: string | null = null;

	// Load comments from API on mount
	async function loadComments() {
		const response = await fetch(`/api/projects/${project.id}/comments`);
		if (response.ok) {
			const result = await response.json();
			comments = result.data ?? [];
		}
	}

	loadComments();

	function handleTextSelection(artifactId: string) {
		const comp = editorComponents[artifactId];
		if (!comp) return;

		const ed = comp.getEditor();
		if (!ed) return;

		const { from, to } = ed.state.selection;
		if (from === to) {
			commentPopup = { ...commentPopup, visible: false };
			return;
		}

		const selectedText = ed.state.doc.textBetween(from, to, ' ');
		if (!selectedText.trim()) {
			commentPopup = { ...commentPopup, visible: false };
			return;
		}

		const coords = ed.view.coordsAtPos(to);
		const editorRect = ed.view.dom.getBoundingClientRect();

		pendingCommentSelection = { artifactId, text: selectedText, from, to };
		commentPopup = {
			x: coords.left - editorRect.left + editorRect.width / 2,
			y: coords.top - editorRect.top - 8,
			visible: true
		};
	}

	function startAddComment() {
		if (!pendingCommentSelection) return;
		showCommentInput = true;
		newCommentText = '';
		showRightSidebar = true;
		sidebarTab = 'comments';
		commentPopup = { ...commentPopup, visible: false };

		const comp = editorComponents[pendingCommentSelection.artifactId];
		if (comp) {
			const ed = comp.getEditor();
			if (ed) {
				const { from, to } = pendingCommentSelection;
				ed.chain().setTextSelection({ from, to }).run();
			}
		}

		tick().then(() => {
			const input = document.getElementById('new-comment-input');
			input?.focus();
		});
	}

	// ── AI rewrite selected text ──
	let aiRewriting = false;
	let aiRewriteInput = '';
	let showAiRewritePanel = false;

	function startAiRewrite() {
		if (!pendingCommentSelection) return;
		showAiRewritePanel = true;
		aiRewriteInput = '';
		showRightSidebar = true;
		sidebarTab = 'fields';
		commentPopup = { ...commentPopup, visible: false };

		tick().then(() => {
			const input = document.getElementById('ai-rewrite-input');
			input?.focus();
		});
	}

	async function submitAiRewrite() {
		if (!pendingCommentSelection || !aiRewriteInput.trim() || aiRewriting) return;
		aiRewriting = true;

		const { artifactId, text, from, to } = pendingCommentSelection;

		const response = await fetch(`/api/projects/${project.id}/section-chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				artifact_id: artifactId,
				conversation_id: conversationId ?? undefined,
				message: `Herschrijf de volgende tekst volgens deze instructie:\n\nTekst: "${text}"\n\nInstructie: ${aiRewriteInput.trim()}`
			})
		});

		const result = await response.json();

		if (response.ok && result.data) {
			conversationId = result.data.conversation_id;

			if (result.data.has_update && result.data.updated_artifact) {
				sectionContents[artifactId] = result.data.updated_artifact.content ?? sectionContents[artifactId];
				sectionSavedContents[artifactId] = sectionContents[artifactId];
				sectionContents = sectionContents;
			} else {
				// Apply rewritten text directly
				const comp = editorComponents[artifactId];
				if (comp) {
					const ed = comp.getEditor();
					if (ed) {
						const rewrittenText = result.data.content ?? text;
						ed.chain().focus().setTextSelection({ from, to }).insertContent(rewrittenText).run();
					}
				}
			}
		}

		aiRewriting = false;
		showAiRewritePanel = false;
		pendingCommentSelection = null;
	}

	function cancelAiRewrite() {
		showAiRewritePanel = false;
		aiRewriteInput = '';
		pendingCommentSelection = null;
	}

	async function submitComment() {
		if (!pendingCommentSelection || !newCommentText.trim()) return;

		const response = await fetch(`/api/projects/${project.id}/comments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				artifact_id: pendingCommentSelection.artifactId,
				selected_text: pendingCommentSelection.text,
				comment_text: newCommentText.trim()
			})
		});

		if (response.ok) {
			const result = await response.json();
			comments = [...comments, result.data];
		}

		newCommentText = '';
		showCommentInput = false;
		pendingCommentSelection = null;
	}

	async function resolveComment(commentId: string) {
		comments = comments.map((c) =>
			c.id === commentId ? { ...c, resolved: true } : c
		);

		const response = await fetch(`/api/projects/${project.id}/comments/${commentId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resolved: true })
		});

		if (!response.ok) {
			comments = comments.map((c) =>
				c.id === commentId ? { ...c, resolved: false } : c
			);
		}
	}

	async function deleteComment(commentId: string) {
		const prev = comments;
		comments = comments.filter((c) => c.id !== commentId);
		if (activeCommentId === commentId) activeCommentId = null;

		const response = await fetch(`/api/projects/${project.id}/comments/${commentId}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			comments = prev;
		}
	}

	function scrollToCommentSection(artifactId: string) {
		const el = sectionElements[artifactId];
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	// Filter comments
	$: activeComments = comments.filter((c) => !c.resolved);
	$: resolvedComments = comments.filter((c) => c.resolved);
	$: currentSectionComments = activeArtifact
		? comments.filter((c) => c.artifact_id === activeArtifact.id && !c.resolved)
		: [];

	function formatCommentTime(iso: string): string {
		const d = new Date(iso);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffMin = Math.floor(diffMs / 60000);
		if (diffMin < 1) return 'Zojuist';
		if (diffMin < 60) return `${diffMin} min geleden`;
		const diffHours = Math.floor(diffMin / 60);
		if (diffHours < 24) return `${diffHours} uur geleden`;
		return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
	}

	function getCommentAuthor(comment: DocumentComment): string {
		if (comment.author) {
			return `${comment.author.first_name} ${comment.author.last_name}`;
		}
		return 'Onbekend';
	}

	function getArtifactTitle(artifactId: string): string {
		const artifact = artifacts.find((a) => a.id === artifactId);
		return artifact?.title ?? 'Onbekende sectie';
	}

	// ── Search state ──
	let showSearch = false;
	let searchQuery = '';
	let searchResults: { artifactId: string; index: number }[] = [];
	let currentSearchResult = 0;
	let searchInput: HTMLInputElement;

	function toggleSearch() {
		showSearch = !showSearch;
		if (showSearch) {
			tick().then(() => searchInput?.focus());
		} else {
			clearSearch();
		}
	}

	function clearSearch() {
		searchQuery = '';
		searchResults = [];
		currentSearchResult = 0;
		removeSearchHighlights();
	}

	function removeSearchHighlights() {
		if (typeof window === 'undefined') return;
		for (const artifact of artifacts) {
			const comp = editorComponents[artifact.id];
			if (!comp) continue;
			const ed = comp.getEditor();
			if (!ed) continue;
			const marks = ed.view.dom.querySelectorAll('mark.search-highlight');
			marks.forEach((mark) => {
				const parent = mark.parentNode;
				if (parent) {
					parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
					parent.normalize();
				}
			});
		}
	}

	function performSearch() {
		removeSearchHighlights();
		searchResults = [];
		currentSearchResult = 0;

		const query = searchQuery.toLowerCase().trim();
		if (!query) return;

		let resultIndex = 0;
		for (const artifact of artifacts) {
			const comp = editorComponents[artifact.id];
			if (!comp) continue;
			const ed = comp.getEditor();
			if (!ed) continue;

			const text = ed.getText();
			const lowerText = text.toLowerCase();
			let pos = 0;

			while ((pos = lowerText.indexOf(query, pos)) !== -1) {
				searchResults.push({ artifactId: artifact.id, index: resultIndex });
				resultIndex++;
				pos += query.length;
			}
		}

		searchResults = searchResults;

		if (searchResults.length > 0) {
			currentSearchResult = 0;
			highlightAndScrollToResult();
		}
	}

	function highlightAndScrollToResult() {
		removeSearchHighlights();

		if (currentSearchResult < 0 || currentSearchResult >= searchResults.length) return;

		const result = searchResults[currentSearchResult];
		const el = sectionElements[result.artifactId];
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}

		if (typeof window === 'undefined') return;

		const query = searchQuery.toLowerCase();
		let globalIndex = 0;

		for (const artifact of artifacts) {
			const comp = editorComponents[artifact.id];
			if (!comp) continue;
			const ed = comp.getEditor();
			if (!ed) continue;

			const editorEl = ed.view.dom;
			const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT);
			const textNodes: Text[] = [];

			let node: Text | null;
			while ((node = walker.nextNode() as Text | null)) {
				textNodes.push(node);
			}

			for (const textNode of textNodes) {
				const nodeText = textNode.textContent ?? '';
				const lowerNodeText = nodeText.toLowerCase();
				let pos = 0;
				let lastEnd = 0;
				const fragments: (string | { text: string; isCurrent: boolean })[] = [];
				let hasMatch = false;

				while ((pos = lowerNodeText.indexOf(query, pos)) !== -1) {
					hasMatch = true;
					if (pos > lastEnd) {
						fragments.push(nodeText.substring(lastEnd, pos));
					}
					const isCurrent = globalIndex === currentSearchResult;
					fragments.push({ text: nodeText.substring(pos, pos + query.length), isCurrent });
					lastEnd = pos + query.length;
					globalIndex++;
					pos += query.length;
				}

				if (hasMatch) {
					if (lastEnd < nodeText.length) {
						fragments.push(nodeText.substring(lastEnd));
					}

					const parent = textNode.parentNode;
					if (!parent) continue;

					const frag = document.createDocumentFragment();
					for (const part of fragments) {
						if (typeof part === 'string') {
							frag.appendChild(document.createTextNode(part));
						} else {
							const mark = document.createElement('mark');
							mark.className = `search-highlight${part.isCurrent ? ' search-current' : ''}`;
							mark.textContent = part.text;
							frag.appendChild(mark);
						}
					}

					parent.replaceChild(frag, textNode);
				}
			}
		}
	}

	function nextSearchResult() {
		if (searchResults.length === 0) return;
		currentSearchResult = (currentSearchResult + 1) % searchResults.length;
		highlightAndScrollToResult();
	}

	function prevSearchResult() {
		if (searchResults.length === 0) return;
		currentSearchResult = (currentSearchResult - 1 + searchResults.length) % searchResults.length;
		highlightAndScrollToResult();
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (event.shiftKey) {
				prevSearchResult();
			} else if (searchResults.length === 0) {
				performSearch();
			} else {
				nextSearchResult();
			}
		}
		if (event.key === 'Escape') {
			toggleSearch();
		}
	}

	// ── Zoom & font size state ──
	const ZOOM_LEVELS = [75, 90, 100, 110, 125, 150];
	const ZOOM_BASE = 1.25;
	const FONT_SIZES = [
		{ value: '9', label: '9pt' },
		{ value: '10', label: '10pt' },
		{ value: '11', label: '11pt' },
		{ value: '12', label: '12pt' },
		{ value: '14', label: '14pt' },
		{ value: '16', label: '16pt' },
		{ value: '18', label: '18pt' }
	];
	let zoomLevel = 100;
	let fontSize = '11';

	function zoomIn() {
		const idx = ZOOM_LEVELS.indexOf(zoomLevel);
		if (idx < ZOOM_LEVELS.length - 1) {
			zoomLevel = ZOOM_LEVELS[idx + 1];
		}
	}

	function zoomOut() {
		const idx = ZOOM_LEVELS.indexOf(zoomLevel);
		if (idx > 0) {
			zoomLevel = ZOOM_LEVELS[idx - 1];
		}
	}

	// ── Shared toolbar state ──
	let editorComponents: Record<string, TiptapEditor> = {};
	let focusedEditor: Editor | null = null;

	// Toolbar reactive state
	let isBold = false;
	let isItalic = false;
	let isStrike = false;
	let isBulletList = false;
	let isOrderedList = false;
	let isBlockquote = false;
	let headingLevel: number | null = null;
	let isInTable = false;
	let showTableMenu = false;

	function updateToolbarFromEditor(editor: Editor | null) {
		if (!editor) {
			isBold = false;
			isItalic = false;
			isStrike = false;
			isBulletList = false;
			isOrderedList = false;
			isBlockquote = false;
			headingLevel = null;
			isInTable = false;
			return;
		}
		isBold = editor.isActive('bold');
		isItalic = editor.isActive('italic');
		isStrike = editor.isActive('strike');
		isBulletList = editor.isActive('bulletList');
		isOrderedList = editor.isActive('orderedList');
		isBlockquote = editor.isActive('blockquote');
		isInTable = editor.isActive('table');

		if (editor.isActive('heading', { level: 1 })) headingLevel = 1;
		else if (editor.isActive('heading', { level: 2 })) headingLevel = 2;
		else if (editor.isActive('heading', { level: 3 })) headingLevel = 3;
		else headingLevel = null;
	}

	function handleEditorFocus(artifactId: string) {
		const comp = editorComponents[artifactId];
		if (comp) {
			focusedEditor = comp.getEditor();
		}
		const idx = artifacts.findIndex((a) => a.id === artifactId);
		if (idx >= 0) currentSectionIndex = idx;
	}

	// Poll toolbar state from focused editor on transactions
	$: if (focusedEditor) {
		const ed = focusedEditor;
		const handler = () => updateToolbarFromEditor(ed);
		ed.on('transaction', handler);
		updateToolbarFromEditor(ed);
	}

	// Toolbar actions
	function toggleBold() { focusedEditor?.chain().focus().toggleBold().run(); }
	function toggleItalic() { focusedEditor?.chain().focus().toggleItalic().run(); }
	function toggleStrike() { focusedEditor?.chain().focus().toggleStrike().run(); }
	function toggleBulletList() { focusedEditor?.chain().focus().toggleBulletList().run(); }
	function toggleOrderedList() { focusedEditor?.chain().focus().toggleOrderedList().run(); }
	function toggleBlockquote() { focusedEditor?.chain().focus().toggleBlockquote().run(); }
	function setHeading(level: 1 | 2 | 3) { focusedEditor?.chain().focus().toggleHeading({ level }).run(); }
	function setParagraph() { focusedEditor?.chain().focus().setParagraph().run(); }
	function insertTable() { focusedEditor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }
	function addColumnBefore() { focusedEditor?.chain().focus().addColumnBefore().run(); }
	function addColumnAfter() { focusedEditor?.chain().focus().addColumnAfter().run(); }
	function deleteColumn() { focusedEditor?.chain().focus().deleteColumn().run(); }
	function addRowBefore() { focusedEditor?.chain().focus().addRowBefore().run(); }
	function addRowAfter() { focusedEditor?.chain().focus().addRowAfter().run(); }
	function deleteRow() { focusedEditor?.chain().focus().deleteRow().run(); }
	function deleteTable() { focusedEditor?.chain().focus().deleteTable().run(); }
	function undo() { focusedEditor?.chain().focus().undo().run(); }
	function redo() { focusedEditor?.chain().focus().redo().run(); }

	// Section element refs for scroll-to
	let sectionElements: Record<string, HTMLElement> = {};

	function scrollToSection(index: number) {
		currentSectionIndex = index;
		const artifact = artifacts[index];
		if (artifact && sectionElements[artifact.id]) {
			sectionElements[artifact.id].scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	async function handleStepClick(index: number) {
		scrollToSection(index);
	}

	// Progress
	$: approvedCount = artifacts.filter((a) => a.status === 'approved').length;
	$: totalCount = artifacts.length;

	// Stepper steps
	$: steps = artifacts.map((a, i) => ({
		label: a.title,
		status: (a.status === 'approved'
			? 'completed'
			: i === currentSectionIndex
				? 'active'
				: 'pending') as 'completed' | 'active' | 'pending',
		hasWarning: !a.content || a.content.trim() === ''
	}));

	// Scroll tracking for stepper
	let documentScrollContainer: HTMLElement;

	function handleScroll() {
		if (!documentScrollContainer) return;
		const containerRect = documentScrollContainer.getBoundingClientRect();
		const threshold = containerRect.top + 150;

		for (let i = artifacts.length - 1; i >= 0; i--) {
			const el = sectionElements[artifacts[i].id];
			if (el) {
				const rect = el.getBoundingClientRect();
				if (rect.top <= threshold) {
					if (currentSectionIndex !== i) {
						currentSectionIndex = i;
					}
					break;
				}
			}
		}
	}

	async function scrollChatToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	async function saveAllContent() {
		if (!hasChanges || saving) return;
		saving = true;
		saveMessage = '';

		const changedArtifacts = artifacts.filter(
			(a) => (sectionContents[a.id] ?? '') !== (sectionSavedContents[a.id] ?? '')
		);

		let allOk = true;
		for (const artifact of changedArtifacts) {
			const response = await fetch(`/api/projects/${project.id}/artifacts/${artifact.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: sectionContents[artifact.id] })
			});

			if (response.ok) {
				sectionSavedContents[artifact.id] = sectionContents[artifact.id];
			} else {
				allOk = false;
			}
		}

		saveMessage = allOk ? 'Opgeslagen' : 'Fout bij opslaan';
		saving = false;
		setTimeout(() => { saveMessage = ''; }, 2000);
	}

	async function sendChatMessage() {
		if (!chatInput.trim() || chatLoading || !activeArtifact) return;

		const userMessage = chatInput.trim();
		chatInput = '';
		chatLoading = true;

		chatMessages = [
			...chatMessages,
			{
				id: `user-${Date.now()}`,
				role: 'user',
				content: userMessage,
				created_at: new Date().toISOString()
			}
		];
		await scrollChatToBottom();

		const response = await fetch(`/api/projects/${project.id}/section-chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				artifact_id: activeArtifact.id,
				conversation_id: conversationId ?? undefined,
				message: userMessage
			})
		});

		const result = await response.json();

		if (!response.ok) {
			chatMessages = [
				...chatMessages,
				{
					id: `error-${Date.now()}`,
					role: 'assistant',
					content: `Fout: ${result.message ?? 'Er is een fout opgetreden'}`,
					created_at: new Date().toISOString()
				}
			];
			chatLoading = false;
			await scrollChatToBottom();
			return;
		}

		conversationId = result.data.conversation_id;

		chatMessages = [
			...chatMessages,
			{
				id: result.data.message_id,
				role: 'assistant',
				content: result.data.content,
				created_at: new Date().toISOString()
			}
		];

		if (result.data.has_update && result.data.updated_artifact) {
			sectionContents[activeArtifact.id] = result.data.updated_artifact.content ?? sectionContents[activeArtifact.id];
			sectionSavedContents[activeArtifact.id] = sectionContents[activeArtifact.id];
			sectionContents = sectionContents;
		}

		chatLoading = false;
		await scrollChatToBottom();
	}

	function handleChatKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendChatMessage();
		}
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
			event.preventDefault();
			if (!showSearch) {
				toggleSearch();
			} else {
				searchInput?.focus();
				searchInput?.select();
			}
		}
	}
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

<svelte:head>
	<title>Conceptovereenkomst — {project.name} — Tendermanager</title>
</svelte:head>

<!-- Fullscreen document editor -->
<div class="fixed inset-0 z-[60] flex flex-col bg-[#F5F5F5]">
	<!-- Header bar -->
	<header class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
		<div class="flex items-center gap-4">
			<Breadcrumbs items={[
				{ label: project.name, href: `/projects/${project.id}` },
				{ label: 'Conceptovereenkomst' }
			]} />
		</div>
		<h1 class="text-sm font-semibold text-gray-900">Conceptovereenkomst</h1>
		<div class="flex items-center gap-3">
			{#if hasChanges}
				<span class="flex items-center gap-1.5 text-xs text-amber-600">
					<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
					Niet-opgeslagen wijzigingen
				</span>
			{/if}
			{#if saveMessage}
				<span class="text-xs text-success-600">{saveMessage}</span>
			{/if}
			<button
				on:click={saveAllContent}
				disabled={!hasChanges || saving}
				class="rounded-md bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				type="button"
			>
				{saving ? 'Opslaan...' : 'Opslaan'}
			</button>
		</div>
	</header>

	<!-- Fixed formatting toolbar -->
	<div class="shared-toolbar flex shrink-0 flex-wrap items-center justify-center gap-1.5 border-b border-gray-200 bg-white px-6 py-2">
		<!-- Undo/Redo -->
		<button on:click={undo} class="toolbar-btn" title="Ongedaan maken" aria-label="Ongedaan maken" type="button" disabled={!focusedEditor}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
		</button>
		<button on:click={redo} class="toolbar-btn" title="Opnieuw uitvoeren" aria-label="Opnieuw uitvoeren" type="button" disabled={!focusedEditor}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" /></svg>
		</button>

		<span class="toolbar-divider"></span>

		<!-- Heading select -->
		<select
			on:change={(e) => {
				const val = (e.target as HTMLSelectElement).value;
				if (val === 'p') setParagraph();
				else setHeading(Number(val) as 1 | 2 | 3);
			}}
			value={headingLevel ? String(headingLevel) : 'p'}
			class="toolbar-select"
			title="Tekststijl"
			aria-label="Tekststijl"
			disabled={!focusedEditor}
		>
			<option value="p">Paragraaf</option>
			<option value="1">Kop 1</option>
			<option value="2">Kop 2</option>
			<option value="3">Kop 3</option>
		</select>

		<span class="toolbar-divider"></span>

		<!-- Inline formatting -->
		<button on:click={toggleBold} class="toolbar-btn" class:active={isBold} title="Vet (Ctrl+B)" aria-label="Vet" aria-pressed={isBold} type="button" disabled={!focusedEditor}>
			<span class="text-sm font-bold">B</span>
		</button>
		<button on:click={toggleItalic} class="toolbar-btn" class:active={isItalic} title="Cursief (Ctrl+I)" aria-label="Cursief" aria-pressed={isItalic} type="button" disabled={!focusedEditor}>
			<span class="text-sm italic">I</span>
		</button>
		<button on:click={toggleStrike} class="toolbar-btn" class:active={isStrike} title="Doorhalen" aria-label="Doorhalen" aria-pressed={isStrike} type="button" disabled={!focusedEditor}>
			<span class="text-sm line-through">S</span>
		</button>

		<span class="toolbar-divider"></span>

		<!-- Lists -->
		<button on:click={toggleBulletList} class="toolbar-btn" class:active={isBulletList} title="Opsommingslijst" aria-label="Opsommingslijst" aria-pressed={isBulletList} type="button" disabled={!focusedEditor}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
		</button>
		<button on:click={toggleOrderedList} class="toolbar-btn" class:active={isOrderedList} title="Genummerde lijst" aria-label="Genummerde lijst" aria-pressed={isOrderedList} type="button" disabled={!focusedEditor}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
		</button>
		<button on:click={toggleBlockquote} class="toolbar-btn" class:active={isBlockquote} title="Citaat" aria-label="Citaat" aria-pressed={isBlockquote} type="button" disabled={!focusedEditor}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
		</button>

		<span class="toolbar-divider"></span>

		<!-- Table -->
		<div class="relative">
			<button
				on:click={() => {
					if (isInTable) {
						showTableMenu = !showTableMenu;
					} else {
						insertTable();
					}
				}}
				class="toolbar-btn"
				class:active={isInTable}
				title={isInTable ? 'Tabelopties' : 'Tabel invoegen'}
				aria-label={isInTable ? 'Tabelopties' : 'Tabel invoegen'}
				type="button"
				disabled={!focusedEditor}
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" /></svg>
			</button>

			{#if showTableMenu && isInTable}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
					on:mouseleave={() => { showTableMenu = false; }}
				>
					<button on:click={() => { addColumnBefore(); showTableMenu = false; }} class="table-menu-btn" type="button">Kolom links invoegen</button>
					<button on:click={() => { addColumnAfter(); showTableMenu = false; }} class="table-menu-btn" type="button">Kolom rechts invoegen</button>
					<button on:click={() => { deleteColumn(); showTableMenu = false; }} class="table-menu-btn text-error-600" type="button">Kolom verwijderen</button>
					<hr class="my-1 border-gray-200">
					<button on:click={() => { addRowBefore(); showTableMenu = false; }} class="table-menu-btn" type="button">Rij boven invoegen</button>
					<button on:click={() => { addRowAfter(); showTableMenu = false; }} class="table-menu-btn" type="button">Rij onder invoegen</button>
					<button on:click={() => { deleteRow(); showTableMenu = false; }} class="table-menu-btn text-error-600" type="button">Rij verwijderen</button>
					<hr class="my-1 border-gray-200">
					<button on:click={() => { deleteTable(); showTableMenu = false; }} class="table-menu-btn text-error-600" type="button">Tabel verwijderen</button>
				</div>
			{/if}
		</div>

		<span class="toolbar-divider"></span>

		<!-- Font size -->
		<select
			bind:value={fontSize}
			class="toolbar-select"
			title="Lettergrootte"
			aria-label="Lettergrootte"
		>
			{#each FONT_SIZES as size}
				<option value={size.value}>{size.label}</option>
			{/each}
		</select>

		<span class="toolbar-divider"></span>

		<!-- Zoom controls -->
		<button on:click={zoomOut} class="toolbar-btn" title="Uitzoomen" aria-label="Uitzoomen" type="button" disabled={zoomLevel <= ZOOM_LEVELS[0]}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
		</button>
		<span class="min-w-[3rem] text-center text-xs font-medium text-gray-600">{zoomLevel}%</span>
		<button on:click={zoomIn} class="toolbar-btn" title="Inzoomen" aria-label="Inzoomen" type="button" disabled={zoomLevel >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>
		</button>

		<span class="toolbar-divider"></span>

		<!-- Search -->
		<button on:click={toggleSearch} class="toolbar-btn" class:active={showSearch} title="Zoeken (Ctrl+F)" aria-label="Zoeken" type="button">
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
		</button>

		<span class="toolbar-divider"></span>

		<!-- Comments toggle -->
		<button on:click={toggleCommentsSidebar} class="toolbar-btn relative" class:active={showRightSidebar && sidebarTab === 'comments'} class:has-comments={activeComments.length > 0 && !(showRightSidebar && sidebarTab === 'comments')} title="Opmerkingen tonen/verbergen" aria-label="Opmerkingen tonen/verbergen" type="button">
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
			{#if activeComments.length > 0}
				<span class="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">{activeComments.length}</span>
			{/if}
		</button>
	</div>

	<!-- Search bar (collapsible) -->
	{#if showSearch}
		<div class="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-50 px-6 py-2">
			<div class="relative flex items-center">
				<svg class="pointer-events-none absolute left-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
				<input
					bind:this={searchInput}
					bind:value={searchQuery}
					on:keydown={handleSearchKeydown}
					on:input={performSearch}
					type="text"
					placeholder="Zoeken in document..."
					class="h-8 w-64 rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
					aria-label="Zoekterm invoeren"
				/>
			</div>

			{#if searchResults.length > 0}
				<span class="text-xs text-gray-500">{currentSearchResult + 1} van {searchResults.length}</span>
			{:else if searchQuery.trim()}
				<span class="text-xs text-gray-400">Geen resultaten</span>
			{/if}

			<button on:click={prevSearchResult} class="toolbar-btn" title="Vorige (Shift+Enter)" aria-label="Vorig resultaat" type="button" disabled={searchResults.length === 0}>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
			</button>
			<button on:click={nextSearchResult} class="toolbar-btn" title="Volgende (Enter)" aria-label="Volgend resultaat" type="button" disabled={searchResults.length === 0}>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
			</button>
			<button on:click={toggleSearch} class="toolbar-btn" title="Zoeken sluiten" aria-label="Zoeken sluiten" type="button">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
			</button>
		</div>
	{/if}

	<!-- Main content: 20% stepper | 60% document | 20% sidebar -->
	<div class="flex min-h-0 flex-1 overflow-hidden">
		<!-- Left: Stepper sidebar (20%) with contract settings -->
		<aside class="hidden shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white lg:flex" style="width: 20%;">
			<!-- Contract settings -->
			<div class="shrink-0 border-b border-gray-200 p-4">
				<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Instellingen</h3>

				<!-- Type opdracht -->
				<label for="contract-type" class="mt-3 block text-xs font-medium text-gray-700">
					Type opdracht
				</label>
				<select
					id="contract-type"
					bind:value={contractType}
					on:change={saveSettings}
					disabled={settingsSaving}
					class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
				>
					<option value={null}>Selecteer...</option>
					{#each Object.entries(CONTRACT_TYPE_LABELS) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>

				<!-- Algemene voorwaarden -->
				<label for="general-conditions" class="mt-3 block text-xs font-medium text-gray-700">
					Algemene voorwaarden
				</label>
				<select
					id="general-conditions"
					bind:value={generalConditions}
					on:change={saveSettings}
					disabled={settingsSaving}
					class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
				>
					<option value={null}>Selecteer...</option>
					{#each Object.entries(GENERAL_CONDITIONS_LABELS) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>
				{#if generalConditions && generalConditions !== 'custom'}
					<p class="mt-1 text-[10px] text-gray-400">
						{GENERAL_CONDITIONS_DESCRIPTIONS[generalConditions] ?? ''}
					</p>
				{/if}
			</div>

			<!-- Progress + Stepper -->
			<div class="flex-1 overflow-y-auto p-4">
				<div class="mb-4">
					<div class="flex items-center justify-between text-xs text-gray-500">
						<span>Voortgang</span>
						<span>{approvedCount}/{totalCount}</span>
					</div>
					<div class="mt-1.5">
						<ProgressBar value={approvedCount} max={totalCount || 1} showPercentage={false} size="sm" />
					</div>
				</div>
				<StepperSidebar
					{steps}
					currentStep={currentSectionIndex}
					onStepClick={handleStepClick}
				/>
			</div>
		</aside>

		<!-- Center: Document — expands when sidebar hidden -->
		<div
			class="flex min-w-0 flex-col overflow-y-auto"
			style="width: {showRightSidebar ? '60%' : '80%'};"
			bind:this={documentScrollContainer}
			on:scroll={handleScroll}
		>
			<div
				class="document-scroll-inner mx-auto py-8"
				style="transform: scale({(zoomLevel / 100) * ZOOM_BASE}); transform-origin: top center; --editor-font-size: {fontSize}pt;"
			>
				{#each artifacts as artifact, index (artifact.id)}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						bind:this={sectionElements[artifact.id]}
						class="relative scroll-mt-4"
						id="section-{artifact.id}"
						on:focusin={() => handleEditorFocus(artifact.id)}
						on:mouseup={() => handleTextSelection(artifact.id)}
					>
						<!-- Section header -->
						<div class="mb-3 flex items-center gap-2">
							<span class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">{index + 1}</span>
							<h2 class="text-base font-semibold text-gray-900">{artifact.title}</h2>
						</div>

						<!-- White paper card — A4 page -->
						<div class="document-paper mb-10 rounded bg-white">
							<TiptapEditor
								bind:this={editorComponents[artifact.id]}
								content={sectionContents[artifact.id] ?? artifact.content ?? ''}
								placeholder="Begin hier met het bewerken van het artikel..."
								showToolbar={false}
								on:change={(e) => {
									sectionContents[artifact.id] = e.detail;
									sectionContents = sectionContents;
								}}
							/>
						</div>

						<!-- Floating action buttons on text selection -->
						{#if commentPopup.visible && pendingCommentSelection?.artifactId === artifact.id}
							<div
								class="comment-popup absolute z-20 flex flex-col gap-2"
								style="right: -3.5rem; top: {commentPopup.y}px;"
							>
								<!-- AI rewrite button -->
								<button
									on:click={startAiRewrite}
									class="flex h-9 w-9 items-center justify-center rounded-full shadow-md ring-2 ring-white transition-transform hover:scale-110"
									title="AI herschrijven"
									aria-label="AI herschrijven"
									type="button"
								>
									<img src="/avatar.png" alt="AI" class="h-9 w-9 rounded-full" />
								</button>
								<!-- Comment button -->
								<button
									on:click={startAddComment}
									class="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 shadow-md ring-2 ring-white transition-transform hover:scale-110 hover:bg-amber-500"
									title="Opmerking toevoegen"
									aria-label="Opmerking toevoegen"
									type="button"
								>
									<svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
								</button>
							</div>
						{/if}
					</div>
				{/each}

				<!-- End of document -->
				{#if artifacts.length > 0}
					<div class="flex items-center justify-center py-8">
						<a
							href="/projects/{project.id}/documents"
							class="inline-flex items-center gap-2 rounded-md bg-success-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-success-700"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Document afronden
						</a>
					</div>
				{:else}
					<div class="flex items-center justify-center py-16">
						<div class="text-center">
							<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<h3 class="mt-3 text-sm font-semibold text-gray-900">Geen artikelen beschikbaar</h3>
							<p class="mt-1 text-sm text-gray-500">
								Voltooi eerst de briefing om de conceptovereenkomst te laten genereren.
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Sidebar (20%) -->
		{#if showRightSidebar}
		<aside class="hidden shrink-0 flex-col border-l border-gray-200 bg-white xl:flex" style="width: 20%;">
			<!-- Sidebar tabs -->
			<div class="flex shrink-0 border-b border-gray-200">
				<button
					on:click={() => { sidebarTab = 'fields'; }}
					class="flex-1 px-3 py-3 text-xs font-medium transition-colors
						{sidebarTab === 'fields'
							? 'border-b-2 border-primary-600 text-primary-600'
							: 'text-gray-500 hover:text-gray-700'}"
					type="button"
				>
					Sectievelden
				</button>
				<button
					on:click={() => { sidebarTab = 'comments'; }}
					class="flex-1 px-3 py-3 text-xs font-medium transition-colors
						{sidebarTab === 'comments'
							? 'border-b-2 border-primary-600 text-primary-600'
							: 'text-gray-500 hover:text-gray-700'}"
					type="button"
				>
					Opmerkingen
				</button>
			</div>

			<!-- Fields tab -->
			{#if sidebarTab === 'fields'}
				<div class="flex flex-1 flex-col overflow-hidden">
					<!-- AI Rewrite panel -->
					{#if showAiRewritePanel && pendingCommentSelection}
						<div class="shrink-0 border-b border-gray-200 p-3">
							<div class="mb-2 flex items-center gap-2">
								<img src="/avatar.png" alt="AI" class="h-6 w-6 rounded-full" />
								<span class="text-xs font-semibold text-gray-900">AI herschrijven</span>
							</div>
							<div class="mb-2 rounded bg-blue-50 px-2.5 py-1.5">
								<p class="text-[10px] font-medium uppercase tracking-wide text-blue-600">Geselecteerde tekst</p>
								<p class="mt-0.5 line-clamp-3 text-xs italic text-gray-700">"{pendingCommentSelection.text}"</p>
							</div>
							<textarea
								id="ai-rewrite-input"
								bind:value={aiRewriteInput}
								on:keydown={(e) => {
									if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
										e.preventDefault();
										submitAiRewrite();
									}
									if (e.key === 'Escape') {
										cancelAiRewrite();
									}
								}}
								rows="3"
								placeholder="Beschrijf hoe je de tekst wilt aanpassen..."
								class="w-full resize-none rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
								aria-label="AI instructie invoeren"
								disabled={aiRewriting}
							></textarea>
							<div class="mt-2 flex items-center justify-between">
								<button
									on:click={cancelAiRewrite}
									class="text-xs text-gray-500 hover:text-gray-700"
									type="button"
									disabled={aiRewriting}
								>
									Annuleren
								</button>
								<button
									on:click={submitAiRewrite}
									disabled={!aiRewriteInput.trim() || aiRewriting}
									class="flex items-center gap-1.5 rounded bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
									type="button"
								>
									{#if aiRewriting}
										<svg class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
										</svg>
										Bezig...
									{:else}
										<img src="/avatar.png" alt="" class="h-3.5 w-3.5 rounded-full" />
										Herschrijven
									{/if}
								</button>
							</div>
						</div>
					{/if}

					<!-- Section fields -->
					<div class="flex-1 overflow-y-auto p-4">
						{#if activeArtifact}
							<h3 class="text-xs font-semibold text-gray-900">{activeArtifact.title}</h3>
							<dl class="mt-3 space-y-3">
								<div>
									<dt class="text-xs font-medium text-gray-500">Status</dt>
									<dd class="mt-1"><StatusBadge status={activeArtifact.status} /></dd>
								</div>
								<div>
									<dt class="text-xs font-medium text-gray-500">Versie</dt>
									<dd class="mt-1 text-xs text-gray-900">{activeArtifact.version}</dd>
								</div>
								<div>
									<dt class="text-xs font-medium text-gray-500">Positie</dt>
									<dd class="mt-1 text-xs text-gray-900">{currentSectionIndex + 1} van {totalCount}</dd>
								</div>
								{#if getSectionDescription(activeArtifact.section_key)}
									<div>
										<dt class="text-xs font-medium text-gray-500">Beschrijving</dt>
										<dd class="mt-1 text-xs text-gray-700">{getSectionDescription(activeArtifact.section_key)}</dd>
									</div>
								{/if}
							</dl>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Comments tab -->
			{#if sidebarTab === 'comments'}
				<div class="flex flex-1 flex-col overflow-hidden">
					<!-- New comment input -->
					{#if showCommentInput && pendingCommentSelection}
						<div class="shrink-0 border-b border-gray-200 p-3">
							<div class="mb-2 rounded bg-amber-50 px-2.5 py-1.5">
								<p class="text-[10px] font-medium uppercase tracking-wide text-amber-600">Geselecteerde tekst</p>
								<p class="mt-0.5 line-clamp-3 text-xs italic text-gray-700">"{pendingCommentSelection.text}"</p>
							</div>
							<textarea
								id="new-comment-input"
								bind:value={newCommentText}
								on:keydown={(e) => {
									if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
										e.preventDefault();
										submitComment();
									}
									if (e.key === 'Escape') {
										showCommentInput = false;
										pendingCommentSelection = null;
									}
								}}
								rows="3"
								placeholder="Schrijf je opmerking..."
								class="w-full resize-none rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
								aria-label="Opmerking invoeren"
							></textarea>
							<div class="mt-2 flex items-center justify-between">
								<button
									on:click={() => { showCommentInput = false; pendingCommentSelection = null; }}
									class="text-xs text-gray-500 hover:text-gray-700"
									type="button"
								>
									Annuleren
								</button>
								<button
									on:click={submitComment}
									disabled={!newCommentText.trim()}
									class="rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
									type="button"
								>
									Toevoegen
								</button>
							</div>
						</div>
					{/if}

					<!-- Comments list -->
					<div class="flex-1 overflow-y-auto">
						{#if activeComments.length === 0 && resolvedComments.length === 0}
							<div class="flex flex-col items-center justify-center px-4 py-12">
								<svg class="mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
								<p class="text-center text-xs text-gray-400">
									Nog geen opmerkingen.<br/>Selecteer tekst in het document om een opmerking toe te voegen.
								</p>
							</div>
						{:else}
							<!-- Active comments -->
							{#if activeComments.length > 0}
								<div class="px-3 pt-3">
									<p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
										Open ({activeComments.length})
									</p>
								</div>
								<div class="space-y-0.5">
									{#each activeComments as comment (comment.id)}
										<!-- svelte-ignore a11y-click-events-have-key-events -->
										<!-- svelte-ignore a11y-no-static-element-interactions -->
										<div
											class="cursor-pointer border-l-2 px-3 py-2.5 transition-colors hover:bg-gray-50
												{activeCommentId === comment.id ? 'border-l-amber-500 bg-amber-50/50' : 'border-l-transparent'}"
											on:click={() => {
												activeCommentId = comment.id;
												scrollToCommentSection(comment.artifact_id);
											}}
										>
											<div class="mb-1 flex items-start justify-between gap-1">
												<span class="text-[10px] font-medium text-amber-600">{getArtifactTitle(comment.artifact_id)}</span>
												<span class="shrink-0 text-[10px] text-gray-400">{formatCommentTime(comment.created_at)}</span>
											</div>
											<p class="mb-1 line-clamp-2 text-[11px] italic text-gray-500">"{comment.selected_text}"</p>
											<p class="text-xs text-gray-800">{comment.comment_text}</p>
											<div class="mt-1.5 flex items-center gap-2">
												<button
													on:click|stopPropagation={() => resolveComment(comment.id)}
													class="flex items-center gap-0.5 text-[10px] text-success-600 hover:text-success-700"
													type="button"
												>
													<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
													Oplossen
												</button>
												<button
													on:click|stopPropagation={() => deleteComment(comment.id)}
													class="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-error-600"
													type="button"
												>
													<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
													Verwijderen
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}

							<!-- Resolved comments -->
							{#if resolvedComments.length > 0}
								<div class="px-3 pt-4">
									<p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
										Opgelost ({resolvedComments.length})
									</p>
								</div>
								<div class="space-y-0.5 opacity-60">
									{#each resolvedComments as comment (comment.id)}
										<div class="border-l-2 border-l-transparent px-3 py-2">
											<div class="mb-1 flex items-start justify-between gap-1">
												<span class="text-[10px] font-medium text-gray-400">{getArtifactTitle(comment.artifact_id)}</span>
												<span class="shrink-0 text-[10px] text-gray-400">{formatCommentTime(comment.created_at)}</span>
											</div>
											<p class="line-clamp-1 text-[11px] italic text-gray-400">"{comment.selected_text}"</p>
											<p class="text-xs text-gray-500 line-through">{comment.comment_text}</p>
											<div class="mt-1">
												<button
													on:click={() => deleteComment(comment.id)}
													class="text-[10px] text-gray-400 hover:text-error-600"
													type="button"
												>
													Verwijderen
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					</div>
				</div>
			{/if}
		</aside>
		{/if}
	</div>
</div>

<!-- Mobile stepper -->
<div class="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white p-2 lg:hidden">
	<div class="flex items-center justify-between px-2">
		<span class="text-xs text-gray-500">
			Artikel {currentSectionIndex + 1} van {totalCount}
		</span>
		<div class="flex gap-1">
			{#each artifacts as _, i}
				<button
					on:click={() => scrollToSection(i)}
					class="h-2 w-2 rounded-full {i === currentSectionIndex
						? 'bg-primary-600'
						: artifacts[i].status === 'approved'
							? 'bg-success-600'
							: 'bg-gray-300'}"
					aria-label="Ga naar artikel {i + 1}"
					type="button"
				></button>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Shared toolbar button styles */
	.toolbar-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.375rem;
		color: #4b5563;
		transition: all 0.1s;
	}
	.toolbar-btn:hover:not(:disabled) {
		background-color: #f3f4f6;
		color: #111827;
	}
	.toolbar-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}
	.toolbar-btn.active {
		background-color: #dbeafe;
		color: #1d4ed8;
	}
	.toolbar-btn.has-comments {
		background-color: #fef3c7;
		color: #d97706;
	}
	.toolbar-btn.has-comments:hover:not(:disabled) {
		background-color: #fde68a;
		color: #b45309;
	}
	.toolbar-select {
		height: 2.25rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		padding: 0 0.75rem;
		font-size: 0.8125rem;
		color: #374151;
		background-color: white;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.5rem center;
		padding-right: 1.75rem;
	}
	.toolbar-select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
	}
	.toolbar-select:disabled {
		opacity: 0.35;
		cursor: default;
	}
	.toolbar-divider {
		display: inline-block;
		width: 1px;
		height: 1.5rem;
		background-color: #e5e7eb;
		margin: 0 0.5rem;
	}
	.table-menu-btn {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		color: #374151;
	}
	.table-menu-btn:hover {
		background-color: #f3f4f6;
	}

	/* A4 page container */
	.document-scroll-inner {
		width: 794px;
	}

	/* Document paper styling — A4 page look */
	.document-paper {
		width: 100%;
		min-height: 1123px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.document-paper :global(.tiptap-editor-wrapper) {
		border: none;
		border-radius: 0.5rem;
		min-height: 1123px;
	}

	.document-paper :global(.tiptap-editor-wrapper .tiptap) {
		padding: 60px 72px;
		min-height: 1123px;
		font-family: 'Asap', sans-serif;
		font-size: var(--editor-font-size, 11pt);
		line-height: 1.6;
		color: #1a1a1a;
	}

	/* Comment popup animation */
	.comment-popup {
		animation: comment-pop 0.15s ease-out;
	}
	@keyframes comment-pop {
		from { transform: scale(0.8); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	/* Search highlights */
	.document-paper :global(mark.search-highlight) {
		background-color: #fef08a;
		color: inherit;
		padding: 0;
		border-radius: 2px;
	}
	.document-paper :global(mark.search-highlight.search-current) {
		background-color: #f97316;
		color: white;
	}
</style>
