import * as vscode from 'vscode';
import { OutputConsole } from '../../../outputConsole';
import { SolutionInfo } from "../../../projectManager";
import { vitisRun } from '../../../utils/vitisRun';

export default async (solution: SolutionInfo) => {
    if (vscode.tasks.taskExecutions.some(value => value.task.source === 'Vitis HLS IDE')) {
        vscode.window.showErrorMessage('A task is already running. Please wait for it to finish before running another one.');
        return;
    }

    const tclContent =
        `open_project ${solution.project.name}\n` +
        `open_solution ${solution.name}\n` +
        `csim_design\n` +
        `exit`;

    OutputConsole.instance.appendLine('Running C simulation...');

    const exitCode = await vitisRun(vscode.Uri.joinPath(solution.project.uri, ".."), tclContent, solution.csimTaskName, {
        reveal: vscode.TaskRevealKind.Always,
        panel: vscode.TaskPanelKind.Shared,
        showReuseMessage: true,
        clear: true,
    });

    const resultsFile = vscode.Uri.joinPath(solution.uri, `${solution.name}.log`);
    await vscode.workspace.fs.readFile(resultsFile).then(content => {
        OutputConsole.instance.appendLine(content.toString());
    });

    switch (exitCode) {
        case 0:
            OutputConsole.instance.appendLine('C simulation completed successfully');
            break;
        case undefined:
            OutputConsole.instance.appendLine('C simulation was cancelled');
            break;
        default:
            OutputConsole.instance.appendLine('C simulation failed with exit code ' + exitCode);
            break;
    }
    OutputConsole.instance.show();
};