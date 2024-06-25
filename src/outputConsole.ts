import * as vscode from 'vscode';

export class OutputConsole {
    static #instance: OutputConsole;

    private channel: vscode.OutputChannel;

    private constructor() {
        this.channel = vscode.window.createOutputChannel('Vitis HLS IDE');
    }

    public static get instance(): OutputConsole {
        if (!OutputConsole.#instance) {
            OutputConsole.#instance = new OutputConsole();
        }

        return OutputConsole.#instance;
    }

    public appendLine(message: string) {
        this.channel.appendLine(message);
    }

    public dispose() {
        this.channel.dispose();
    }
}