import { Plugin, MarkdownPostProcessorContext, MarkdownView, TFile } from 'obsidian';
import { Decoration, EditorView } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";

export default class TagViewerPlugin extends Plugin {
	private highlightEffect: any;
	private highlightField: any;

	async onload() {
		// Register code block processor
		this.registerMarkdownCodeBlockProcessor("tagview", this.processTagViewCodeBlock.bind(this));
		
		// Initialize highlight effect and field
		this.highlightEffect = StateEffect.define<{ from: number, to: number }>();
		this.highlightField = StateField.define<DecorationSet>({
			create: () => Decoration.none(),
			update: (deco, tr) => {
				deco = deco.map(tr.changes);
				for (let e of tr.effects) {
					if (e.is(this.highlightEffect)) {
						const mark = Decoration.mark({
							class: "cm-temp-highlight"
						});
						deco = deco.update({
							add: [mark.range(e.value.from, e.value.to)]
						});
					}
				}
				return deco;
			},
			provide: f => EditorView.decorations.from(f)
		});
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
			
			// Get line positions
			const line = editorView.state.doc.line(lineNumber);
			
			// Scroll with margin
			const viewportHeight = editor.getScrollInfo().clientHeight;
			const margin = viewportHeight / 3;
			editor.scrollIntoView(
				{ from: { line: targetLine, ch: 0 }, to: { line: targetLine, ch: editor.getLine(targetLine).length } },
				margin
			);

			// Apply highlight effect
			editorView.dispatch({
				effects: this.highlightEffect.of({
					from: line.from,
					to: line.to
				})
			});

			// Remove highlight after 2 seconds
			setTimeout(() => {
				editorView.dispatch({
					effects: this.highlightEffect.of({
						from: line.from,
						to: line.to
					}).map(() => [])
				});
			}, 2000);
		}
	}
}
