import path from 'path';
import * as vscode from 'vscode';
import { OutputConsole } from '../outputConsole';
import { SolutionInfo } from "../projectManager";

export default async (solution: SolutionInfo) => {
    const task = vscode.tasks.taskExecutions.find(e => e.task.name === solution.cosimTaskName);

    if (!task) {
        return;
    }

    task.terminate();

    OutputConsole.instance.appendLine('Stopping cosimulation...');
    OutputConsole.instance.show();

    const taskEndListener = vscode.tasks.onDidEndTaskProcess(async e => {
        if (e.execution.task.name === task.task.name) {
            taskEndListener.dispose();

            const filePathToWatch = path.join(solution.project.path, solution.name, `${solution.name}.log`);

            await vscode.workspace.fs.readFile(vscode.Uri.file(filePathToWatch)).then(content => {
                OutputConsole.instance.appendLine(content.toString());
                OutputConsole.instance.show();
            });

            OutputConsole.instance.appendLine('Cosimulation terminated');
        }
    });
};