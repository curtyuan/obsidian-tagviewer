import { App, Plugin } from 'obsidian';

export class TagViewerComponent {
    private plugin: Plugin;
    private app: App;

    constructor(app: App, plugin: Plugin) {
        this.app = app;
        this.plugin = plugin;
    }

    async load(source: string, el: HTMLElement) {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
            el.createEl('p', { text: 'No active file found.' });
            return;
        }

        const content = await this.app.vault.read(file);

        if (content) {
            const contentWithoutCodeBlocks = content.replace(/`{3,}/g, '');
            const tagMatches = contentWithoutCodeBlocks.match(/#\w+/g) || [];
            const uniqueTags = [...new Set(tagMatches)];

            if (uniqueTags.length === 0) {
                el.createEl('p', { text: 'No tags found in the current file.' });
                return;
            }

            const resultsByTag = {};
            uniqueTags.forEach(tag => {
                resultsByTag[tag] = [];
            });

            const lines = contentWithoutCodeBlocks.split('\n');
            lines.forEach((line, index) => {
                uniqueTags.forEach(tag => {
                    if (line.includes(tag)) {
                        resultsByTag[tag].push({
                            sentence: line.replace(tag, '').trim(),
                            lineNumber: index + 1
                        });
                    }
                });
            });

            const table = el.createEl('table', { cls: 'tag-viewer-table' });
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            headerRow.insertCell().textContent = 'Tag Name';
            headerRow.insertCell().textContent = 'Line';

            const tbody = table.createTBody();

            uniqueTags.forEach(tag => {
                const tagName = tag.replace('#', '');

                const tagRow = tbody.insertRow();
                tagRow.classList.add('tag-row');
                const tagCell = tagRow.insertCell();
                tagCell.colSpan = 2;
                tagCell.textContent = tagName;

                resultsByTag[tag].forEach(result => {
                    const contentRow = tbody.insertRow();
                    contentRow.classList.add('content-row');

                    const sentenceCell = contentRow.insertCell();
                    sentenceCell.textContent = result.sentence;

                    const lineCell = contentRow.insertCell();
                    lineCell.classList.add('match-line');
                    const lineLink = this.createLineLink(file.path, result.lineNumber, tagName);
                    lineCell.appendChild(lineLink);
                });
            });
        } else {
            el.createEl('p', { text: 'No content found in the current file.' });
        }
    }

    private createLineLink(path: string, lineNumber: number, tagName: string): HTMLElement {
        const link = document.createElement('a');
        link.dataset.href = `obsidian://open?path=${encodeURIComponent(path)}&line=${lineNumber}`;
        link.textContent = String(lineNumber);
        link.classList.add('tag-link');
        link.dataset.tag = tagName;
        
        // Add click event listener to the link
        link.addEventListener('click', (event) => {
            event.preventDefault();
            this.plugin.handleTagLinkClick(event);
        });
        
        return link;
    }
} 