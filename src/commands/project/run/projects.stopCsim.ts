import * as vscode from 'vscode';
import { HLSProject } from '../../../models/hlsProject';
import { HLSProjectSolution } from '../../../models/hlsProjectSolution';
import { OutputConsole } from '../../../outputConsole';

export default async (project: HLSProject, solution: HLSProjectSolution) => {
    const task = vscode.tasks.taskExecutions.find(e => e.task.name === solution.csimTaskName(project));

    if (!task) {
        return;
    }

    task.terminate();

    OutputConsole.instance.appendLine('Stopping C simulation...');
    OutputConsole.instance.show();

    const taskEndListener = vscode.tasks.onDidEndTaskProcess(async e => {
        if (e.execution.task.name === task.task.name) {
            taskEndListener.dispose();

            const filePathToWatch = vscode.Uri.joinPath(project.uri, solution.name, `${solution.name}.log`);

            await vscode.workspace.fs.readFile(filePathToWatch).then(content => {
                OutputConsole.instance.appendLine(content.toString());
                OutputConsole.instance.show();
            });

            OutputConsole.instance.appendLine('C simulation terminated');
        }
    });
};