import path from 'path';
import { EventEmitter } from 'stream';
import * as vscode from 'vscode';
import { OutputConsole } from './outputConsole';

type ProjectManagerEvents = { 'projectsChanged': [] };

export default class ProjectManager extends EventEmitter<ProjectManagerEvents> {
    static #instance: ProjectManager;

    private _projects: ProjectInfo[] = [];
    private _queueRefresh: boolean = false;
    private _refreshing: boolean = false;

    readonly projects = this._projects;

    private constructor() {
        super();
        this.refresh();
    }

    public static get instance(): ProjectManager {
        if (!ProjectManager.#instance) {
            ProjectManager.#instance = new ProjectManager();
        }

        return ProjectManager.#instance;
    }

    // Methods

    public refresh() {
        this._queueRefresh = true;
        this.tryRefresh();
    }

    private async tryRefresh() {
        if (this._refreshing) {
            return;
        }

        this._refreshing = true;
        this._queueRefresh = false;

        OutputConsole.instance.appendLine('Refreshing projects...');

        this._projects.length = 0;

        const files = await vscode.workspace.findFiles('**/hls.app', '**/node_modules/**', 10);

        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const absoluteDirPath = path.dirname(files[i].fsPath);
                const relativeDirPath = vscode.workspace.asRelativePath(absoluteDirPath);

                const project = new ProjectInfo(absoluteDirPath);
                const solutionFiles = await vscode.workspace.findFiles(relativeDirPath + '/*/*.aps', undefined, 10);
                const solutions = solutionFiles.map(f => new SolutionInfo(path.basename(path.dirname(f.fsPath)), project));
                project.solutions.push(...solutions);

                this._projects.push(project);
            }
            OutputConsole.instance.appendLine('Found ' + this._projects.length + ' HLS projects');
        } else {
            OutputConsole.instance.appendLine('No HLS projects found');
        }

        this._refreshing = false;
        this.emit('projectsChanged');

        if (this._queueRefresh) {
            this.tryRefresh();
        }
    }

    public dispose() {
        this.removeAllListeners();
    }
}

export class ProjectInfo {
    public readonly name: string;
    public readonly path: string;
    public solutions: SolutionInfo[];

    constructor(absolutePath: string, solutions: SolutionInfo[] = []) {
        this.name = path.basename(absolutePath);
        this.path = absolutePath;
        this.solutions = solutions;

        // this.terminal = vscode.window.createTerminal('Vitis HLS IDE - ' + name);
        // this.terminal.sendText('cd ' + this.path);
        // this.terminal.sendText('cmd /c "C:\\Xilinx\\Vitis_HLS\\2023.2\\bin\\vitis_hls -i"');
        // this.terminal.sendText('open_project ' + name);
        // this.terminal.show();
    }
}

export class SolutionInfo {
    public readonly project: ProjectInfo;
    public readonly name: string;

    public readonly debugCsimTaskName: string;
    public readonly csimTaskName: string;
    public readonly csynthTaskName: string;
    public readonly cosimTaskName: string;

    constructor(name: string, project: ProjectInfo) {
        this.name = name;
        this.project = project;

        const id = path.join(this.project.path, this.name);
        this.debugCsimTaskName = `Debug C simulation for ${id}`;
        this.csimTaskName = `C simulation for ${id}`;
        this.csynthTaskName = `C synthesis for ${id}`;
        this.cosimTaskName = `Cosimulation for ${id}`;
    }
}