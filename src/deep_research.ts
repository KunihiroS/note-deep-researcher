import { App, TFile, Notice } from 'obsidian';
import { DeepResearchRunState } from './settings';
import { DeepResearchProvider } from './providers/DeepResearchProvider';
import { GeminiDeepResearchProvider } from './providers/GeminiDeepResearchProvider';
import * as path from 'path';
import type NoteDeepResearcherPlugin from './main';

export class DeepResearchService {
    private app: App;
    private plugin: NoteDeepResearcherPlugin;
    private provider: DeepResearchProvider | null = null;
    private checkIntervalId: number | null = null;
    private noticeIntervalId: number | null = null;

    constructor(app: App, plugin: NoteDeepResearcherPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    public async startResearch(activeFile: TFile) {
        const settings = this.plugin.settings;

        // 1. Validate settings
        if (!settings.deepResearchEnabled) {
            new Notice('Deep research is disabled in settings.');
            void this.log('DR_DISABLED', 'Deep Research is disabled');
            return;
        }

        if (!settings.deepResearchPromptPath) {
            new Notice('Deep research prompt path is not configured.');
            void this.log('DR_PROMPT_PATH_MISSING', 'Prompt path missing');
            return;
        }

        if (!settings.deepResearchEnvFilePath) {
            new Notice('Deep research .env file path is not configured.');
            void this.log('DR_ENV_PATH_MISSING', 'Env file path missing');
            return;
        }

        // 2. Check for existing run
        if (settings.currentRun) {
            // If we are already running for this note, maybe just focus/notify?
            // If for another note, warn?
            // The README says: "If a run is already in progress and the user triggers the command again, the plugin proceeds Reset / Abandon..." 
            // Wait, the README says: "proceeds Reset / Abandon the current run. See below for details."
            // "If a run is already in progress and the user clicks the ribbon icon, show a confirmation UI"
            // For now, let's block or ask to reset. The UI part is in main.ts. 
            // Here we assume startResearch is called after confirmation if needed.
            // But if called directly, we should probably fail if busy.
             new Notice(`Deep Research is already running for ${settings.currentRun.noteBasename}. Please reset/abandon first.`);
             return;
        }

        // 3. Initialize Provider
        try {
            this.provider = new GeminiDeepResearchProvider(settings.deepResearchEnvFilePath);
        } catch (e) {
            new Notice('Failed to initialize provider');
            void this.log('DR_INIT_FAILED', `Provider init failed: ${String(e)}`);
            return;
        }

        // 4. Read Prompt and Note Context
        let promptContent = '';
        try {
            const promptFile = this.app.vault.getAbstractFileByPath(settings.deepResearchPromptPath);
            if (promptFile instanceof TFile) {
                promptContent = await this.app.vault.read(promptFile);
            } else {
                throw new Error("Prompt file not found");
            }
        } catch (e) {
            new Notice('Failed to read prompt file.');
            void this.log('DR_PROMPT_READ_FAILED', `Read prompt failed: ${String(e)}`);
            return;
        }

        let noteContent = '';
        try {
            noteContent = await this.app.vault.read(activeFile);
        } catch (e) {
             new Notice('Failed to read active note.');
             void this.log('DR_NOTE_READ_FAILED', `Read note failed: ${String(e)}`);
             return;
        }

        // 5. Start Research
        try {
            const interactionId = await this.provider.startResearch(noteContent, promptContent);
            
            // 6. Persist State
            const runState: DeepResearchRunState = {
                interactionId: interactionId,
                notePath: activeFile.path,
                noteBasename: activeFile.basename,
                startTime: new Date().toISOString()
            };
            this.plugin.settings.currentRun = runState;
            await this.plugin.saveSettings();

            new Notice('Deep research started. Running in background...');
            void this.log('DR_STARTED', `Started for ${activeFile.basename}`);

            // 7. Start Polling
            this.startPolling();

        } catch (e) {
            new Notice('Failed to start deep research session.');
            void this.log('DR_REQUEST_FAILED', `Start request failed: ${String(e)}`);
        }
    }

    public async resetAbandonRun() {
        if (this.plugin.settings.currentRun) {
            const noteName = this.plugin.settings.currentRun.noteBasename;
            this.plugin.settings.currentRun = null;
            await this.plugin.saveSettings();
            this.stopPolling();
            new Notice(`Deep Research run for ${noteName} abandoned.`);
            void this.log('DR_ABANDONED', `Run for ${noteName} abandoned`);
        } else {
            new Notice('No active run to abandon.');
        }
    }

    public startPolling() {
        if (this.checkIntervalId) return; // Already polling

        const settings = this.plugin.settings;
        if (!settings.currentRun) return;

        // Re-init provider if needed (e.g. after restart)
        if (!this.provider) {
             try {
                this.provider = new GeminiDeepResearchProvider(settings.deepResearchEnvFilePath);
            } catch (e) {
                console.error("Failed to re-init provider during polling start", e);
                // If we can't init provider, we can't poll. 
                // We should probably log this and maybe stop trying?
                return;
            }
        }

        const checkInterval = (settings.deepResearchCheckIntervalSec || 60) * 1000;
        const noticeInterval = (settings.deepResearchNoticeIntervalSec || 5) * 1000;

        // Status Check Loop
        this.checkIntervalId = window.setInterval(() => {
            void this.checkRunStatus();
        }, checkInterval);

        // Notice Loop
        this.noticeIntervalId = window.setInterval(() => {
            if (this.plugin.settings.currentRun) {
                new Notice(`Deep Research in progress for ${this.plugin.settings.currentRun.noteBasename}...`);
            }
        }, noticeInterval);
    }

    public stopPolling() {
        if (this.checkIntervalId) {
            window.clearInterval(this.checkIntervalId);
            this.checkIntervalId = null;
        }
        if (this.noticeIntervalId) {
            window.clearInterval(this.noticeIntervalId);
            this.noticeIntervalId = null;
        }
    }

    private async checkRunStatus() {
        const currentRun = this.plugin.settings.currentRun;
        if (!currentRun || !this.provider) {
            this.stopPolling();
            return;
        }

        try {
            const status = await this.provider.checkStatus(currentRun.interactionId);
            
            if (status.state === 'completed') {
                await this.handleCompletion(currentRun, status.report);
            } else if (status.state === 'failed') {
                await this.handleFailure(currentRun, status.error);
            }
            // If running, do nothing
        } catch (e) {
            console.error("Check status failed", e);
            // Log but don't stop polling immediately? Or retry?
            // For now just log.
        }
    }

    private async handleCompletion(runState: DeepResearchRunState, reportContent?: string) {
        this.stopPolling();

        try {
            let report = reportContent;
            if (!report && this.provider) {
                report = await this.provider.getReport(runState.interactionId);
            }

            if (!report) {
                throw new Error("No report content available");
            }

            // Write report
            const reportDir = runState.noteBasename;
            const reportFile = `${reportDir}/${runState.noteBasename}_deep_research.md`;
            
            // Ensure directory exists
            // Vault.createFolder checks existence but might throw if it exists. 
            // safer to check abstract file.
            if (!this.app.vault.getAbstractFileByPath(reportDir)) {
                await this.app.vault.createFolder(reportDir);
            }

            const header = `# ${runState.noteBasename} deep research report\n## ${new Date().toISOString()}\n\n`;
            const finalContent = header + report;

            const existingFile = this.app.vault.getAbstractFileByPath(reportFile);
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, finalContent);
            } else {
                await this.app.vault.create(reportFile, finalContent);
            }

            new Notice(`Deep Research completed for ${runState.noteBasename}. Saved to ${reportFile}`);
            void this.log('DR_OK', `Completed for ${runState.noteBasename}`);

        } catch (e) {
            new Notice(`Deep Research completed but failed to save report: ${String(e)}`);
            void this.log('DR_WRITE_FAILED', `Write failed: ${String(e)}`);
        } finally {
            // Clear run state
            this.plugin.settings.currentRun = null;
            await this.plugin.saveSettings();
        }
    }

    private async handleFailure(runState: DeepResearchRunState, error: string) {
        this.stopPolling();
        new Notice(`Deep Research failed for ${runState.noteBasename}: ${error}`);
        void this.log('DR_REQUEST_FAILED', `Run failed: ${error}`);
        
        this.plugin.settings.currentRun = null;
        await this.plugin.saveSettings();
    }

    private async log(reason: string, message: string) {
        // Use configDir to support custom config folders (usually .obsidian)
        const logPath = path.join(this.app.vault.configDir, 'plugins/note-deep-researcher/note-deep-researcher.log');
        
        try {
             // Construct log line
             const timestamp = new Date().toISOString();
             const line = `[${timestamp}] [${reason}] ${message}\n`;

             // Use adapter to append
             // adapter.write/append expects relative path from vault root
             if (await this.app.vault.adapter.exists(logPath)) {
                 await this.app.vault.adapter.append(logPath, line);
             } else {
                 await this.app.vault.adapter.write(logPath, line);
             }
        } catch (e) {
            console.error("Failed to write log", e);
        }
    }
}
