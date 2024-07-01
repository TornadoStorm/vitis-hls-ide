import path from 'path';
import * as vscode from 'vscode';
import { taskSource } from '../../../constants';
import { HLSProject } from '../../../models/hlsProject';
import { HLSProjectSolution } from '../../../models/hlsProjectSolution';
import { vitisRun } from '../../../utils/vitisRun';

export default async (project: HLSProject, solution: HLSProjectSolution) => {
    if (vscode.tasks.taskExecutions.some(value => value.task.source === taskSource)) {
        vscode.window.showErrorMessage('A task is already running. Please wait for it to finish before running another one.');
        return;
    }

    const tclContent =
        `open_project ${project.name}\n` +
        `open_solution ${solution.name}\n` +
        `csim_design -setup\n` +
        `exit`;

    const buildResult = await vitisRun(vscode.Uri.joinPath(project.uri, ".."), tclContent, solution.buildCsimTaskName(project), {
        reveal: vscode.TaskRevealKind.Always,
        panel: vscode.TaskPanelKind.Shared,
        showReuseMessage: true,
        clear: true,
    },
        ['$vitis-hls-ide-csim'],
    );

    if (buildResult === undefined) {
        vscode.window.showErrorMessage('C simulation was cancelled.');
        return;
    } else if (buildResult !== 0) {
        vscode.window.showErrorMessage('Failed to build C Simulation binaries.\nExited with code ' + buildResult);
        return;
    }

    const hlsPath = vscode.workspace.getConfiguration('vitis-hls-ide')?.get<string>('hlsPath');

    if (!hlsPath) {
        vscode.window.showErrorMessage('HLS path not set. Please set the path to the Vitis HLS installation in the extension settings.');
        return;
    }

    const debugConfig: vscode.DebugConfiguration = {
        "name": solution.debugCsimTaskName(project),
        "type": "cppdbg",
        "request": "launch",
        "program": vscode.Uri.joinPath(project.uri, solution.name, "csim/build/csim.exe"),
        "args": [],
        "stopAtEntry": false,
        "cwd": "${workspaceFolder}",
        "environment": [],
        "externalConsole": false,
        "MIMode": "gdb",
        "miDebuggerPath": path.join(hlsPath, "/tps/win64/msys64/mingw64/bin/gdb.exe"),
        "setupCommands": [
            {
                "description": "Enable pretty-printing for gdb",
                "text": "-enable-pretty-printing",
                "ignoreFailures": true
            }
        ],
    };

    // const resultsFile = vscode.Uri.joinPath(project.uri, solution.name, `${solution.name}.log`);
    // await vscode.workspace.fs.readFile(resultsFile).then(content => {
    //     OutputConsole.instance.appendLine(content.toString());
    // });

    // switch (exitCode) {
    //     case 0:
    //         OutputConsole.instance.appendLine('C simulation completed successfully');
    //         break;
    //     case undefined:
    //         OutputConsole.instance.appendLine('C simulation was cancelled');
    //         break;
    //     default:
    //         OutputConsole.instance.appendLine('C simulation failed with exit code ' + exitCode);
    //         break;
    // }
    // OutputConsole.instance.show();

    const started = await vscode.debug.startDebugging(undefined, debugConfig);
    if (!started) {
        vscode.window.showErrorMessage('Failed to start debug session.');
    }
};