import * as vscode from 'vscode';
import { taskSource } from '../../../constants';
import { HLSProject } from '../../../models/hlsProject';
import { HLSProjectSolution } from '../../../models/hlsProjectSolution';
import { OutputConsole } from '../../../outputConsole';
import { vitisRun } from '../../../utils/vitisRun';

export default async (project: HLSProject, solution: HLSProjectSolution) => {
    if (vscode.tasks.taskExecutions.some(value => value.task.source === taskSource)) {
        vscode.window.showErrorMessage('A task is already running. Please wait for it to finish before running another one.');
        return;
    }

    const tclContent =
        `open_project ${project.name}\n` +
        `open_solution ${solution.name}\n` +
        `cosim_design\n` +
        `exit`;

    OutputConsole.instance.appendLine('Running cosimulation...');

    const exitCode = await vitisRun(vscode.Uri.joinPath(project.uri, ".."), tclContent, solution.cosimTaskName(project), {
        reveal: vscode.TaskRevealKind.Always,
        panel: vscode.TaskPanelKind.Shared,
        showReuseMessage: true,
        clear: true,
    });

    const resultsFile = vscode.Uri.joinPath(project.uri, solution.name, `${solution.name}.log`);
    await vscode.workspace.fs.readFile(resultsFile).then(content => {
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