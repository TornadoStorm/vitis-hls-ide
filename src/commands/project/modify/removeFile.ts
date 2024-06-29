import lodash from 'lodash';
import path from 'path';
import * as vscode from 'vscode';
import xml2js from 'xml2js';
import { ProjectInfo } from '../../../projectManager';

export default async (project: ProjectInfo, uri: vscode.Uri, testBench: boolean) => {
    const nameType = testBench ? 'test bench' : 'source';

    const confirmOption: vscode.MessageItem = { title: 'OK' };
    const result = await vscode.window.showInformationMessage(
        `Remove ${nameType} file: ${path.basename(uri.fsPath)} from ${project.name}?`,
        <vscode.MessageOptions>{ modal: true, detail: "The original file will not be deleted" },
        confirmOption
    );

    if (result === undefined) { return; }

    const projectFile = vscode.Uri.joinPath(project.uri, "hls.app");
    if (projectFile === undefined) {
        vscode.window.showErrorMessage(`Failed to remove ${nameType} file: Failed to find project file`);
        return;
    }

    const startPath = vscode.Uri.joinPath(project.uri, "..");

    try {
        const data = await vscode.workspace.fs.readFile(projectFile);
        const parsed = await xml2js.parseStringPromise(Buffer.from(data).toString());
        let toDelete = path.relative(startPath.fsPath, uri.fsPath);
        if (testBench) {
            toDelete = path.join("..", "..", toDelete); // For some reason test bench paths are two levels up
        }
        for (let i = 0; i < parsed.project.files[0].file.length; i++) {
            const filePath = path.normalize(parsed.project.files[0].file[i].$.name);
            const isTb = parsed.project.files[0].file[i].$.tb === "1";
            if (filePath === toDelete && (testBench === isTb)) {
                parsed.project.files[0].file.splice(i, 1);
                break;
            }
        }
        const builder = new xml2js.Builder({ headless: true });
        const xml = builder.buildObject(parsed);
        await vscode.workspace.fs.writeFile(projectFile, Buffer.from(xml));
    } catch (e) {
        vscode.window.showErrorMessage(`Failed to remove ${nameType} file: ${e}`);
        return;
    }

    vscode.window.showInformationMessage(`${lodash.upperFirst(nameType)} file removed successfully`);

    await vscode.commands.executeCommand('vitis-hls-ide.projects.refresh');
};