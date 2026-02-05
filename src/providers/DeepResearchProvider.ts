export interface DeepResearchProvider {
    /**
     * Starts a new research session.
     * @param context The content of the note to research.
     * @param prompt The instructions for the research.
     * @returns A promise that resolves to the interaction ID.
     */
    startResearch(context: string, prompt: string): Promise<string>;

    /**
     * Checks the status of an existing research session.
     * @param interactionId The ID of the interaction to check.
     * @returns A promise that resolves to the current status.
     */
    checkStatus(interactionId: string): Promise<ResearchStatus>;

    /**
     * Retrieves the final report for a completed research session.
     * @param interactionId The ID of the interaction.
     * @returns A promise that resolves to the markdown report.
     */
    getReport(interactionId: string): Promise<string>;
}

export type ResearchStatus = 
    | { state: 'running' }
    | { state: 'completed', report?: string } // report might be included in status check for optimization
    | { state: 'failed', error: string };
