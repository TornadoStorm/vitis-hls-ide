import path from 'path';
import vscode from 'vscode';
import xml2js from 'xml2js';
import { HLSProjectFile } from './hlsProjectFile';
import { HLSProjectSolution } from './hlsProjectSolution';

export class HLSProject {
    public name: string;
    public uri: vscode.Uri;
    public solutions: HLSProjectSolution[];
    public files: HLSProjectFile[];

    constructor(uri: vscode.Uri, solutions: HLSProjectSolution[] = [], files: HLSProjectFile[] = []) {
        this.name = path.basename(path.dirname(uri.path));
        this.uri = vscode.Uri.joinPath(uri, '..');
        this.solutions = solutions;
        this.files = files;
    }

    static async fromFile(uri: vscode.Uri): Promise<HLSProject> {
        const data = await vscode.workspace.fs.readFile(uri);
        const parsed = await xml2js.parseStringPromise(Buffer.from(data).toString());
        const solutions: HLSProjectSolution[] = parsed.project.solutions[0].solution.map((json: any) => HLSProjectSolution.fromJson(json.$));
        const files: HLSProjectFile[] = parsed.project.files[0].file.map((json: any) => HLSProjectFile.fromJson(json.$));
        return new HLSProject(uri, solutions, files);
    }

    public update(project: HLSProject) {
        this.name = project.name;
        this.uri = project.uri;
        this.solutions = project.solutions;
        this.files = project.files;
    }
}