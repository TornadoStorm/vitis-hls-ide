import fs from 'fs';
import os from 'os';
import path from 'path';
import * as vscode from 'vscode';
import { OutputConsole } from '../outputConsole';
import { SolutionInfo } from "../projectManager";

export default async (solution: SolutionInfo) => {
    if (vscode.tasks.taskExecutions.some(value => value.task.source === 'Vitis HLS IDE')) {
        vscode.window.showErrorMessage('A task is already running. Please wait for it to finish before running another one.');
        return;
    }

    const vitisPath = vscode.workspace.getConfiguration('vitis-hls-ide')?.get<string>('vitisPath');

    if (!vitisPath) {
        vscode.window.showErrorMessage('Vitis path not set. Please set the path to the Vitis installation in the extension settings.');
        return;
    }

    OutputConsole.instance.appendLine('Running cosimulation...');
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
            vscode.window.showErrorMessage(`Error writing tcl file for cosimulation: ${err.message}`);
            return;
        }

        const task = new vscode.Task(
            { type: 'shell' },
            vscode.TaskScope.Workspace,
            'Run cosimulation',
            'Vitis HLS IDE',
            new vscode.ShellExecution(`cd ${path.join(solution.project.path, "..")} && cmd /c "${path.join(vitisPath, "bin", "vitis-run")} --mode hls --tcl ${tclFilePath}"`),
            [],
        );

        task.presentationOptions = {
            reveal: vscode.TaskRevealKind.Always,
            panel: vscode.TaskPanelKind.Shared,
            showReuseMessage: true,
            clear: true,
        };

        vscode.tasks.executeTask(task);

        const taskEndListener = vscode.tasks.onDidEndTaskProcess(async e => {
            if (e.execution.task.name === task.name) {
                taskEndListener.dispose();

                fs.unlink(tclFilePath, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage(`Error deleting tcl file for cosimulation: ${err.message}`);
                    }
                });

                const filePathToWatch = path.join(solution.project.path, solution.name, `${solution.name}.log`);

                await vscode.workspace.fs.readFile(vscode.Uri.file(filePathToWatch)).then(content => {
                    OutputConsole.instance.appendLine(content.toString());
                    OutputConsole.instance.show();
                });

                if (e.exitCode !== 0) {
                    OutputConsole.instance.appendLine('Cosimulation failed');
                    return;
                } else {
                    OutputConsole.instance.appendLine('Cosimulation finished');
                }
            }
        });
    });
};