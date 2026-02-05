import {App, PluginSettingTab, Setting} from "obsidian";
import NoteDeepResearcherPlugin from "./main";

export interface DeepResearchRunState {
	interactionId: string;
	notePath: string;
	noteBasename: string;
	startTime: string;
}

export interface NoteDeepResearcherSettings {
	deepResearchEnabled: boolean;
	deepResearchPromptPath: string;
	deepResearchNoticeIntervalSec: number;
	deepResearchCheckIntervalSec: number;
	deepResearchEnvFilePath: string;
	currentRun?: DeepResearchRunState | null;
}

export const DEFAULT_SETTINGS: NoteDeepResearcherSettings = {
	deepResearchEnabled: false,
	deepResearchPromptPath: '',
	deepResearchNoticeIntervalSec: 5,
	deepResearchCheckIntervalSec: 60,
	deepResearchEnvFilePath: '',
	currentRun: null
}

export class DeepResearchSettingTab extends PluginSettingTab {
	plugin: NoteDeepResearcherPlugin;

	constructor(app: App, plugin: NoteDeepResearcherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Enable deep research')
			.setDesc('Enable the deep research feature')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.deepResearchEnabled)
				.onChange(async (value) => {
					this.plugin.settings.deepResearchEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Deep research prompt path')
			.setDesc('Vault-relative path to a prompt file used for deep research')
			.addText(text => text
				.setPlaceholder('Templates/DeepResearchPrompt.md')
				.setValue(this.plugin.settings.deepResearchPromptPath)
				.onChange(async (value) => {
					this.plugin.settings.deepResearchPromptPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Notice interval (seconds)')
			.setDesc('How often to show “in progress” notices')
			.addText(text => text
				.setPlaceholder('5')
				.setValue(String(this.plugin.settings.deepResearchNoticeIntervalSec))
				.onChange(async (value) => {
					const numValue = Number(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.deepResearchNoticeIntervalSec = numValue;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Check interval (seconds)')
			.setDesc('How often to poll interactions.get() for the active run')
			.addText(text => text
				.setPlaceholder('60')
				.setValue(String(this.plugin.settings.deepResearchCheckIntervalSec))
				.onChange(async (value) => {
					const numValue = Number(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.deepResearchCheckIntervalSec = numValue;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Env file path')
			.setDesc('Absolute path to an external .env file (outside the vault)')
			.addText(text => text
				.setPlaceholder('/path/to/.env')
				.setValue(this.plugin.settings.deepResearchEnvFilePath)
				.onChange(async (value) => {
					this.plugin.settings.deepResearchEnvFilePath = value;
					await this.plugin.saveSettings();
				}));
	}
}
