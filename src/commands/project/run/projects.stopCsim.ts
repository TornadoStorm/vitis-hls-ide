import * as vscode from 'vscode';
import { HLSProject } from '../../../models/hlsProject';
import { HLSProjectSolution } from '../../../models/hlsProjectSolution';

export default async (project: HLSProject, solution: HLSProjectSolution) => {
    // Stop debugging if debugging
    if (vscode.debug.activeDebugSession?.name === solution.debugCsimTaskName(project)) {
        vscode.debug.stopDebugging();
    }

    // Stop building if building
    const task = vscode.tasks.taskExecutions.find(e => e.task.name === solution.buildCsimTaskName(project));

    if (!task) {
        return;
    }

    task.terminate();

    const taskEndListener = vscode.tasks.onDidEndTaskProcess(async e => {
        if (e.execution.task.name === task.task.name) {
            taskEndListener.dispose();
            vscode.window.showInformationMessage('C simulation stopped.');
        }
    });
};