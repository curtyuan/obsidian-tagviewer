# TagViewer Plugin for Obsidian

TagViewer is a plugin for [Obsidian](https://obsidian.md) that allows you to view and navigate tags within your notes using a convenient table format.

## Features

- Automatically extracts tags from the current note
- Displays tags in a table format with line numbers and context
- Generates clickable links to quickly navigate to the corresponding line in the note
- Lazy-loads components for optimal performance
- Cleans up resources when not in use

## Installation

1. Clone this repository to your local machine
2. Run `npm install` to install the necessary dependencies
3. Run `npm run dev` to start compilation in watch mode
4. In Obsidian, go to Settings > Community plugins > Turn off Safe mode
5. Click "Browse" and select the `manifest.json` file from your cloned repository
6. Enable the TagViewer plugin in the Community Plugins section

## Usage

To use the TagViewer plugin, simply create a code block with the language set to `tagview` in your note:

```tagview
```

The plugin will automatically process the code block and render the tag viewer table below it.

## Development

This plugin is built using TypeScript and the Obsidian API. The main plugin logic is located in `main.ts`, while the tag processing and rendering logic is in `tagViewer.ts`.

To start developing:

1. Clone this repository to your local machine
2. Run `npm install` to install the necessary dependencies
3. Run `npm run dev` to start compilation in watch mode
4. Make changes to the `.ts` files
5. Reload Obsidian to see your changes take effect



![alt text](screenshot/tagview.gif)
