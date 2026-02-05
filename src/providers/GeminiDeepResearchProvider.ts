import { requestUrl } from 'obsidian';
import { DeepResearchProvider, ResearchStatus } from "./DeepResearchProvider";
import * as fs from 'fs';

export class GeminiDeepResearchProvider implements DeepResearchProvider {
    private apiKey: string;
    private agent: string;
    private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    constructor(envFilePath: string) {
        this.loadCredentials(envFilePath);
    }

    private loadCredentials(envFilePath: string) {
        try {
            if (!fs.existsSync(envFilePath)) {
                throw new Error("Env file not found");
            }
            const envContent = fs.readFileSync(envFilePath, 'utf8');
            const envVars: {[key: string]: string} = {};
            envContent.split('\n').forEach((line: string) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;

                const match = trimmed.match(/^([^=]+)=(.*)$/);
                if (match && match[1] && match[2]) {
                    envVars[match[1].trim()] = match[2].trim();
                }
            });

            if (envVars['LLM_PROVIDER'] !== 'gemini') {
                throw new Error("LLM_PROVIDER is not gemini");
            }
            this.apiKey = envVars['GEMINI_API_KEY'] || '';
            this.agent = envVars['GEMINI_AGENT'] || 'deep-research-pro-preview-12-2025';

            if (!this.apiKey) {
                throw new Error("Missing GEMINI_API_KEY");
            }
        } catch (e) {
            console.error("Failed to load credentials", e);
            throw e;
        }
    }

    async startResearch(context: string, prompt: string): Promise<string> {
        const input = [
            prompt.trim(),
            '',
            '---',
            '## Note context',
            context.trim(),
        ].join('\n');

        const url = `${this.baseUrl}/interactions`;
        const res = await requestUrl({
            url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': this.apiKey,
            },
            body: JSON.stringify({
                input,
                agent: this.agent,
                background: true,
                store: true,
            }),
            throw: false,
        });

        if (res.status < 200 || res.status >= 300) {
            throw new Error(`Gemini interactions.create failed: HTTP ${res.status}`);
        }

        const data = res.json as { id?: string } | undefined;
        const interactionId = data?.id;
        if (!interactionId) {
            throw new Error('Gemini interactions.create response missing id');
        }
        return interactionId;
    }

    async checkStatus(interactionId: string): Promise<ResearchStatus> {
        const url = `${this.baseUrl}/interactions/${encodeURIComponent(interactionId)}`;
        const res = await requestUrl({
            url,
            method: 'GET',
            headers: {
                'x-goog-api-key': this.apiKey,
            },
            throw: false,
        });

        if (res.status < 200 || res.status >= 300) {
            return { state: 'failed', error: `HTTP ${res.status}` };
        }

        const data = res.json as {
            status?: string;
            error?: unknown;
            outputs?: Array<{ text?: string }>;
        } | undefined;

        const status = data?.status;
        if (status === 'completed') {
            const outputs = data?.outputs;
            const lastText = outputs && outputs.length > 0 ? outputs[outputs.length - 1]?.text : undefined;
            return { state: 'completed', report: lastText };
        }

        if (status === 'failed') {
            const errText = typeof data?.error === 'string'
                ? data.error
                : data?.error
                    ? JSON.stringify(data.error)
                    : 'unknown error';
            return { state: 'failed', error: errText };
        }

        return { state: 'running' };
    }

    async getReport(interactionId: string): Promise<string> {
        const status = await this.checkStatus(interactionId);
        if (status.state === 'completed') {
            if (!status.report) {
                throw new Error('Gemini interaction completed but report text was empty');
            }
            return status.report;
        }
        if (status.state === 'failed') {
            throw new Error(`Gemini interaction failed: ${status.error}`);
        }
        throw new Error('Gemini interaction is still running');
    }
}
