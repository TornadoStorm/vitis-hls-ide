import path from 'path';
import * as vscode from 'vscode';
import { vitisRun } from '../../../utils/vitisRun';
import { ProjectSourceItem } from '../../../views/projects-tree';

export default async (item: ProjectSourceItem) => {
    const options: vscode.OpenDialogOptions = {
        canSelectMany: true,
        openLabel: 'Add Source Files',
        filters: {
            'C++ Source and Header Files': ['cpp', 'h']
        }
    };

    const uris: vscode.Uri[] | undefined = await vscode.window.showOpenDialog(options);

    if (uris === undefined) { return; }

    const startPath = vscode.Uri.joinPath(item.project.uri, "..");

    let tclContent = `open_project ${item.project.name}\n`;
    for (const uri of uris) {
        const relativePath = path.relative(startPath.fsPath, uri.fsPath);
        tclContent += `add_files "${relativePath.replaceAll('\\', '\\\\')}"\n`;
    }
    tclContent += 'exit';


    const exitCode = await vitisRun(
        startPath,
        tclContent,
        `Add source files to ${item.project.name}`,
        {
            reveal: vscode.TaskRevealKind.Silent,
            panel: vscode.TaskPanelKind.Shared,
            clear: true,
            close: true,
        });

    if (exitCode === 0) {
        vscode.window.showInformationMessage('Source files added successfully');
    } else {
        vscode.window.showErrorMessage('Failed to add source files');
    }

    await vscode.commands.executeCommand('vitis-hls-ide.projects.refresh');
};