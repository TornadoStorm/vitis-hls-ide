import lodash from 'lodash';
import path from 'path';
import * as vscode from 'vscode';
import { ProjectInfo } from '../../../projectManager';
import { vitisRun } from '../../../utils/vitisRun';

export default async (project: ProjectInfo, testBench: boolean) => {
    const nameType = testBench ? 'test bench' : 'source';

    const options: vscode.OpenDialogOptions = {
        canSelectMany: true,
        openLabel: `Add ${lodash.startCase(nameType)} Files`,
        filters: {
            'C++ Source and Header Files': ['cpp', 'h']
        }
    };

    const uris: vscode.Uri[] | undefined = await vscode.window.showOpenDialog(options);

    if (uris === undefined) { return; }

    const startPath = vscode.Uri.joinPath(project.uri, "..");

    let tclContent = `open_project ${project.name}\n`;
    for (const uri of uris) {
        const relativePath = path.relative(startPath.fsPath, uri.fsPath);
        tclContent += `add_files ${testBench ? '-tb ' : ' '}"${relativePath.replaceAll('\\', '\\\\')}"\n`;
    }
    tclContent += 'exit';

    const exitCode = await vitisRun(
        startPath,
        tclContent,
        `Add ${nameType} files to ${project.name}`,
        {
            reveal: vscode.TaskRevealKind.Silent,
            panel: vscode.TaskPanelKind.Shared,
            clear: true,
            close: true,
        });

    if (exitCode === 0) {
        vscode.window.showInformationMessage(`${lodash.upperFirst(nameType)} files added successfully`);
    } else {
        vscode.window.showErrorMessage(`Failed to add ${nameType} files`);
    }

    await vscode.commands.executeCommand('vitis-hls-ide.projects.refresh');
};