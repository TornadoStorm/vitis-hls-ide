import fs from 'fs';
import os from 'os';
import path from 'path';
import * as vscode from 'vscode';

// Returns undefined if the task was terminated by the user.
export async function vitisRun(startPath: vscode.Uri, tcl: string, taskName: string, presentationOptions?: vscode.TaskPresentationOptions): Promise<number | undefined> {
    const vitisPath = vscode.workspace.getConfiguration('vitis-hls-ide')?.get<string>('vitisPath');

    if (!vitisPath) {
        throw new Error('Vitis path not set. Please set the path to the Vitis installation in the extension settings.');
    }

    const tempDir = os.tmpdir();
    const fileName = `vitis-hls-ide-tcl-${Date.now()}.tcl`;
    const tclFilePath = path.join(tempDir, fileName);

    fs.writeFileSync(tclFilePath, tcl);

    const shellExecution = new vscode.ShellExecution(
        `vitis-run --mode hls --tcl ${tclFilePath}`,
        {
            cwd: startPath.fsPath,
            env: {
                PATH: process.env.PATH + path.delimiter + path.join(vitisPath, "bin"),
            }
        },
    );

    const task = new vscode.Task(
        { type: 'shell' },
        vscode.TaskScope.Workspace,
        taskName,
        'Vitis HLS IDE',
        shellExecution,
        [],
    );

    if (presentationOptions !== undefined) { task.presentationOptions = presentationOptions; }

    vscode.tasks.executeTask(task);

    const exitCode = new Promise<number | undefined>((resolve, reject) => {
        const disposable = vscode.tasks.onDidEndTaskProcess(e => {
            if (e.execution.task === task) {
                disposable.dispose();
                fs.unlinkSync(tclFilePath);
                resolve(e.exitCode);
            }
        });
    });

    return exitCode;
}