import fs from 'fs';
import os from 'os';
import path from 'path';
import * as vscode from 'vscode';
import { OutputConsole } from '../outputConsole';
import { SolutionInfo } from "../projectManager";

export default async (solution: SolutionInfo) => {
    const vitisPath = vscode.workspace.getConfiguration('vitis-hls-ide')?.get<string>('vitisPath');

    if (!vitisPath) {
        vscode.window.showErrorMessage('Vitis path not set. Please set the path to the Vitis installation in the extension settings.');
        return;
    }

    OutputConsole.instance.appendLine('Running C cosimulation...');
    OutputConsole.instance.show();

    const tclContent =
        `open_project ${solution.project.name}\n` +
        `open_solution ${solution.name}\n` +
        `cosim_design\n` +
        `exit`;

    const tempDir = os.tmpdir();
    const tclFilePath = path.join(tempDir, `cosim-${solution.project.name}-${solution.name}-${Date.now()}.tcl`);

    fs.writeFile(tclFilePath, tclContent, (err) => {
        if (err) {
            vscode.window.showErrorMessage(`Error writing tcl file for C cosimulation: ${err.message}`);
            return;
        }

        const terminal = vscode.window.createTerminal('Run C cosimulation');
        terminal.sendText(`cd ${path.join(solution.project.path, "..")} && cmd /c "${path.join(vitisPath, "bin", "vitis-run")} --mode hls --tcl ${tclFilePath}"`);
        terminal.show();

        const filePathToWatch = path.join(solution.project.path, solution.name, `${solution.name}.log`);
        let watcher = vscode.workspace.createFileSystemWatcher(filePathToWatch);

        // TODO Potential memory leak here, need to dispose the watcher and terminal
        let disposable = watcher.onDidChange(async () => {
            await vscode.workspace.fs.readFile(vscode.Uri.file(filePathToWatch)).then(content => {
                OutputConsole.instance.appendLine(content.toString());
            });
            terminal.dispose();
            disposable.dispose();
            OutputConsole.instance.show();
            OutputConsole.instance.appendLine('C cosimulation finished');
        });
    });
};