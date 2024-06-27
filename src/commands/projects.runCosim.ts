import path from 'path';
import * as vscode from 'vscode';
import { OutputConsole } from '../outputConsole';
import { SolutionInfo } from "../projectManager";
import { vitisRun } from '../utils/vitisRun';

export default async (solution: SolutionInfo) => {
    if (vscode.tasks.taskExecutions.some(value => value.task.source === 'Vitis HLS IDE')) {
        vscode.window.showErrorMessage('A task is already running. Please wait for it to finish before running another one.');
        return;
    }

    const tclContent =
        `open_project ${solution.project.name}\n` +
        `open_solution ${solution.name}\n` +
        `cosim_design\n` +
        `exit`;

    OutputConsole.instance.appendLine('Running cosimulation...');

    const exitCode = await vitisRun(path.join(solution.project.path, ".."), tclContent, solution.cosimTaskName, {
        reveal: vscode.TaskRevealKind.Always,
        panel: vscode.TaskPanelKind.Shared,
        showReuseMessage: true,
        clear: true,
    });

    const resultsFile = path.join(solution.project.path, solution.name, `${solution.name}.log`);
    await vscode.workspace.fs.readFile(vscode.Uri.file(resultsFile)).then(content => {
        OutputConsole.instance.appendLine(content.toString());
    });

    switch (exitCode) {
        case 0:
            OutputConsole.instance.appendLine('Cosimulation completed successfully');
            break;
        case undefined:
            OutputConsole.instance.appendLine('Cosimulation was cancelled');
            break;
        default:
            OutputConsole.instance.appendLine('Cosimulation failed with exit code ' + exitCode);
            break;
    }
    OutputConsole.instance.show();
};