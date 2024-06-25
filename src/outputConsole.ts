import * as vscode from 'vscode';

export class OutputConsole {
    static #instance: OutputConsole;

    private channel: vscode.OutputChannel;

    private constructor() {
        this.channel = vscode.window.createOutputChannel('Vitis HLS IDE', { log: true });
    }

    public static get instance(): OutputConsole {
        if (!OutputConsole.#instance) {
            OutputConsole.#instance = new OutputConsole();
        }

        return OutputConsole.#instance;
    }

    public replace(message: string) {
        this.channel.replace(message);
    }

    public appendLine(message: string) {
        this.channel.appendLine(message);
    }

    public dispose() {
        this.channel.dispose();
    }

    /**
     * Reveal this channel in the UI.
     * @param preserveFocus When `true` the channel will not take focus.
     */
    public show(preserveFocus?: boolean) {
        this.channel.show(preserveFocus);
    }
}