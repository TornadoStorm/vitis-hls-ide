import path from 'path';
import * as vscode from 'vscode';
import xml2js from 'xml2js';
import { ProjectSourceFileItem } from '../../../views/projects-tree';

export default async (item: ProjectSourceFileItem) => {
    const confirmOption: vscode.MessageItem = { title: 'OK' };
    const result = await vscode.window.showInformationMessage(
        `Remove source file: ${item.label} from ${item.project.name}?`,
        <vscode.MessageOptions>{ modal: true, detail: "The original source file will not be deleted" },
        confirmOption
    );

    if (result === undefined) { return; }

    if (item.resourceUri === undefined) {
        vscode.window.showErrorMessage('Failed to remove source file: Source file does not have a URI');
        return;
    }

    const projectFile = vscode.Uri.joinPath(item.project.uri, "hls.app");
    if (projectFile === undefined) {
        vscode.window.showErrorMessage('Failed to remove source file: Failed to find project file');
        return;
    }

    const startPath = vscode.Uri.joinPath(item.project.uri, "..");

    try {
        const data = await vscode.workspace.fs.readFile(projectFile);
        const parsed = await xml2js.parseStringPromise(Buffer.from(data).toString());
        const toDelete = path.relative(startPath.fsPath, item.resourceUri.fsPath);
        for (let i = 0; i < parsed.project.files[0].file.length; i++) {
            const filePath = path.normalize(parsed.project.files[0].file[i].$.name);
            if (filePath === toDelete && parsed.project.files[0].file[i].$.tb === "false") {
                parsed.project.files[0].file.splice(i, 1);
                break;
            }
        }
        const builder = new xml2js.Builder({ headless: true });
        const xml = builder.buildObject(parsed);
        await vscode.workspace.fs.writeFile(projectFile, Buffer.from(xml));
    } catch (e) {
        vscode.window.showErrorMessage(`Failed to remove source file: ${e}`);
        return;
    }

    vscode.window.showInformationMessage('Item removed successfully');

    await vscode.commands.executeCommand('vitis-hls-ide.projects.refresh');
};