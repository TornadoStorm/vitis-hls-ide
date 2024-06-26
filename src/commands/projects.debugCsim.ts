import path from 'path';
import * as vscode from 'vscode';
import { SolutionInfo } from '../projectManager';

export default async (solution: SolutionInfo) => {
    const hlsPath = vscode.workspace.getConfiguration('vitis-hls-ide')?.get<string>('hlsPath');

    if (!hlsPath) {
        vscode.window.showErrorMessage('HLS path not set. Please set the path to the Vitis HLS installation in the extension settings.');
        return;
    }

    const debugConfig: vscode.DebugConfiguration = {
        "name": solution.debugCsimTaskName,
        "type": "cppdbg",
        "request": "launch",
        "program": path.join(solution.project.path, solution.name, "csim/build/csim.exe"),
        "args": [],
        "stopAtEntry": false,
        "cwd": "${workspaceFolder}/src",
        "environment": [],
        "externalConsole": false,
        "MIMode": "gdb",
        "miDebuggerPath": path.join(hlsPath, "/tps/win64/msys64/mingw64/bin/gdb.exe"),
        "setupCommands": [
            {
                "description": "Enable pretty-printing for gdb",
                "text": "-enable-pretty-printing",
                "ignoreFailures": true
            },
            {
                "description": "Set Disassembly Flavor to Intel",
                "text": "-gdb-set disassembly-flavor intel",
                "ignoreFailures": true
            }
        ]
    };

    const started = await vscode.debug.startDebugging(undefined, debugConfig);
    if (!started) {
        vscode.window.showErrorMessage('Failed to start debug session.');
    }
};