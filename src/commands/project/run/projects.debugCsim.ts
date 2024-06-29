import path from 'path';
import * as vscode from 'vscode';
import { HLSProject } from '../../../models/hlsProject';
import { HLSProjectSolution } from '../../../models/hlsProjectSolution';

export default async (project: HLSProject, solution: HLSProjectSolution) => {
    const hlsPath = vscode.workspace.getConfiguration('vitis-hls-ide')?.get<string>('hlsPath');

    if (!hlsPath) {
        vscode.window.showErrorMessage('HLS path not set. Please set the path to the Vitis HLS installation in the extension settings.');
        return;
    }

    // TODO: Build csim as debug prelaunch task

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
        ]
    };

    const started = await vscode.debug.startDebugging(undefined, debugConfig);
    if (!started) {
        vscode.window.showErrorMessage('Failed to start debug session.');
    }
};