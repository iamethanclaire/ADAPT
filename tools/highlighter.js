// Highlighter Tool
const highlighterColor = '#FFFF00';
let isHighlighting = false;

function toggleHighlight(shouldHighlight) {
	isHighlighting = shouldHighlight;

	if (shouldHighlight) {
		document.addEventListener('mouseup', handleSelection);
	} else {
		document.removeEventListener('mouseup', handleSelection);
	}
}

function isBlockElement(element) {
	if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

	const display = window.getComputedStyle(element).display;
	return display === 'block' || display === 'list-item' || display === 'table' || display === 'flex' || display === 'grid';
}

function getBlockElement(node) {
	let element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;

	while (element && element !== document.body) {
		if (isBlockElement(element)) return element;
		element = element.parentElement;
	}

	return document.body;
}

function addHighlightClickHandler(span) {
	span.addEventListener('click', (event) => {
		event.stopPropagation();

		const parent = span.parentNode;
		while (span.firstChild) {
			parent.insertBefore(span.firstChild, span);
		}
		parent.removeChild(span);
	});
}

function createHighlightSpan(range) {
	const span = document.createElement('span');
	span.className = 'adapt-highlight-span';
	span.style.backgroundColor = highlighterColor;
	span.style.cursor = 'pointer';

	const contents = range.extractContents();
	span.appendChild(contents);
	addHighlightClickHandler(span);
	range.insertNode(span);
}

function handleSelection() {
	if (!isHighlighting) return;

	const selection = window.getSelection();
	if (!selection || selection.isCollapsed || selection.toString().trim().length === 0) return;

	try {
		const selectionRange = selection.getRangeAt(0);
		const textWalker = document.createTreeWalker(
			selectionRange.commonAncestorContainer,
			NodeFilter.SHOW_TEXT
		);
		const textNodes = [];
		let textNode;

		if (selectionRange.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
			textNodes.push(selectionRange.commonAncestorContainer);
		}

		while (textNode = textWalker.nextNode()) {
			if (selectionRange.intersectsNode(textNode)) {
				textNodes.push(textNode);
			}
		}

		const blocks = [];
		textNodes.forEach((node) => {
			const block = getBlockElement(node);
			if (!blocks.includes(block)) blocks.push(block);
		});

		// Process blocks in document order so each block gets its own span.
		blocks.forEach((block) => {
			const blockRange = document.createRange();
			const firstNode = textNodes.find((node) => getBlockElement(node) === block);
			const lastNode = [...textNodes].reverse().find((node) => getBlockElement(node) === block);

			if (!firstNode || !lastNode) return;

			if (firstNode === selectionRange.startContainer) {
				blockRange.setStart(firstNode, selectionRange.startOffset);
			} else {
				blockRange.setStart(firstNode, 0);
			}

			if (lastNode === selectionRange.endContainer) {
				blockRange.setEnd(lastNode, selectionRange.endOffset);
			} else {
				blockRange.setEnd(lastNode, lastNode.length);
			}

			if (!blockRange.collapsed) createHighlightSpan(blockRange);
		});

		selection.removeAllRanges();
	} catch (error) {
		console.error('Error highlighting text:', error);
	}
}
