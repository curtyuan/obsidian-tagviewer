import { Plugin, MarkdownPostProcessorContext, MarkdownView, TFile } from 'obsidian';

export default class TagViewerPlugin extends Plugin {
	async onload() {
		// Register code block processor
		this.registerMarkdownCodeBlockProcessor("tagview", this.processTagViewCodeBlock.bind(this));
	}

	async processTagViewCodeBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// Lazy load and initialize components only when tagview code block is encountered 
		const { TagViewerComponent } = await import('./tagViewer');
		const tagViewer = new TagViewerComponent(this.app, this);
		await tagViewer.load(source, el);
	}

	onunload() {
		// Clean up resources as needed
	}

	async handleTagLinkClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.classList.contains('tag-link')) {
			const tagName = target.dataset.tag;
			const lineNumber = parseInt(target.textContent);
			const file = this.app.workspace.getActiveFile();
			if (file && tagName && lineNumber) {
				await this.navigateToTag(file, tagName, lineNumber);
			}
		}
	}

	async navigateToTag(file: TFile, tagName: string, lineNumber: number): Promise<void> {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			const editor = view.editor;
			const targetLine = lineNumber - 1;

			// Set cursor position
			editor.setCursor({ line: targetLine, ch: 0 });

			// Create range for the target line
			const range = {
				from: { line: targetLine, ch: 0 },
				to: { line: targetLine, ch: editor.getLine(targetLine).length }
			};

			// Scroll with margin to position line at 1/3 from top
			const viewportHeight = editor.getScrollInfo().clientHeight;
			const margin = viewportHeight / 3;
			editor.scrollIntoView(range, margin);

			// Add temporary highlight using documented methods
			const currentLine = editor.getLine(targetLine);
			const originalContent = currentLine;
			
			// Add highlight class to the line
			editor.addHighlight(range, 'tag-highlight-line');

			// Remove highlight after animation duration
			setTimeout(() => {
				editor.removeHighlight(range, 'tag-highlight-line');
			}, 4000);
		}
	}
}
