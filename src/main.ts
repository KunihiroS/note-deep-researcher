import {App, MarkdownView, Modal, Notice, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, NoteDeepResearcherSettings, DeepResearchSettingTab} from "./settings";
import { DeepResearchService } from "./deep_research";

export default class NoteDeepResearcherPlugin extends Plugin {
	settings: NoteDeepResearcherSettings;
	service: DeepResearchService;

	async onload() {
		await this.loadSettings();

		this.service = new DeepResearchService(this.app, this);

		// Ribbon Icon
		this.addRibbonIcon('search', 'Run deep research on active note', (evt: MouseEvent) => {
			void this.runDeepResearch();
		});

		// Command
		this.addCommand({
			id: 'run-deep-research',
			name: 'Run deep research on active note',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						void this.runDeepResearch();
					}
					return true;
				}
				return false;
			}
		});

		// Command to reset/abandon
		this.addCommand({
			id: 'reset-abandon-deep-research',
			name: 'Reset / abandon current run',
			callback: () => {
				void this.resetAbandonRun();
			}
		});


		// Settings Tab
		this.addSettingTab(new DeepResearchSettingTab(this.app, this));

		// Resume polling if needed
		if (this.settings.currentRun) {
			this.service.startPolling();
		}
	}

	onunload() {
		if (this.service) {
			this.service.stopPolling();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<NoteDeepResearcherSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async runDeepResearch() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active note found.');
			return;
		}
		
		// If already running, show confirmation (as per README)
		// "If a run is already in progress and the user triggers the command again, the plugin proceeds Reset / Abandon the current run. See below for details."
		// Actually README says: "If a run is already in progress and the user clicks the ribbon icon, show a confirmation UI"
		// But for command palette: "Deep Research: Reset / Abandon current run" is separate. 
		// "If a run is already in progress and the user triggers the command again, the plugin proceeds Reset / Abandon the current run" -> This sentence in README is a bit ambiguous/conflicting with "Reset / Abandon" section.
		// Let's follow the "Ribbon icon while running" logic for general entry if running.
		
		if (this.settings.currentRun) {
			// Show confirmation
			// Since we can't easily pop a native confirmation dialog with custom buttons in Obsidian API simply (without custom Modal),
			// I'll implement a simple Modal for confirmation.
			new ConfirmationModal(this.app, 
				`Deep Research is running for ${this.settings.currentRun.noteBasename}. Abandon it?`,
				'Abandon',
				'Keep running',
				async () => {
					await this.service.resetAbandonRun();
					// Do we start new one immediately? README says "clear the local pending state".
					// It doesn't explicitly say "and start new one". 
					// But usually if I click "Run", I want to run.
					// However, for safety, let's just abandon first. The user can click again.
				}
			).open();
			return;
		}

		await this.service.startResearch(activeFile);
	}

	async resetAbandonRun() {
		await this.service.resetAbandonRun();
	}
}

class ConfirmationModal extends Modal {
	message: string;
	confirmText: string;
	cancelText: string;
	onConfirm: () => void | Promise<void>;

	constructor(app: App, message: string, confirmText: string, cancelText: string, onConfirm: () => void | Promise<void>) {
		super(app);
		this.message = message;
		this.confirmText = confirmText;
		this.cancelText = cancelText;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl('h3', {text: this.message});

		const div = contentEl.createDiv({cls: 'modal-button-container'});
		
		const confirmBtn = div.createEl('button', {text: this.confirmText, cls: 'mod-warning'});
		confirmBtn.addEventListener('click', () => {
			void this.onConfirm();
			this.close();
		});

		const cancelBtn = div.createEl('button', {text: this.cancelText});
		cancelBtn.addEventListener('click', () => {
			this.close();
		});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
