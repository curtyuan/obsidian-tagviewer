import { Plugin, MarkdownPostProcessorContext, MarkdownView, TFile } from 'obsidian';
import { Decoration, EditorView, DecorationSet, RangeSet } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";

// Define the effect at module level
const highlightEffect = StateEffect.define<{ from: number, to: number } | null>();

// Define the theme (minimal configuration)
const highlightTheme = EditorView.baseTheme({
	"&.cm-editor .cm-temp-highlight": {
		// Only define the class, actual styles come from styles.css
	}
});

export default class TagViewerPlugin extends Plugin {
	private highlightField: StateField<DecorationSet>;

	async onload() {
		// Register code block processor
		this.registerMarkdownCodeBlockProcessor("tagview", this.processTagViewCodeBlock.bind(this));
		
		// Define the state field
		this.highlightField = StateField.define<DecorationSet>({
			create() {
				return Decoration.none;
			},
			update: (decorations, transaction) => {
				// Map existing decorations through changes
				decorations = decorations.map(transaction.changes);

				for (let effect of transaction.effects) {
					if (effect.is(highlightEffect)) {
						if (effect.value === null) {
							return Decoration.none;
						}
						
						// Create the decoration
						const decoration = Decoration.mark({
							class: "cm-temp-highlight"
						});
						
						// Create a proper decoration set
						return Decoration.set([
							decoration.range(effect.value.from, effect.value.to)
						]);
					}
				}
				
				return decorations;
			},
			provide: field => EditorView.decorations.from(field)
		});

		// Register both the state field and theme
		this.registerEditorExtension([
			this.highlightField,
			highlightTheme
		]);
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

			// Set cursor and scroll position
			editor.setCursor({ line: targetLine, ch: 0 });
			
			// Get the editor view
			const editorView = (editor as any).cm as EditorView;
			
			if (!editorView) {
				return;
			}

			// Get line positions
			const line = editorView.state.doc.line(lineNumber);
			
			// Scroll with margin
			const viewportHeight = editor.getScrollInfo().clientHeight;
			const margin = viewportHeight / 3;
			editor.scrollIntoView(
				{ from: { line: targetLine, ch: 0 }, to: { line: targetLine, ch: editor.getLine(targetLine).length } },
				margin
			);

			try {
				// Create and dispatch the highlight effect
				editorView.dispatch({
					effects: highlightEffect.of({
						from: line.from,
						to: line.to
					})
				});

				// Remove highlight after 2 seconds
				setTimeout(() => {
					if (editorView.state) {
						editorView.dispatch({
							effects: highlightEffect.of(null)
						});
					}
				}, 2000);
			} catch (error) {
				console.error("Error applying highlight:", error);
			}
		}
	}
}
