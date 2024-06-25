import { basename, dirname } from 'path';
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
                const dirPath = vscode.workspace.asRelativePath(dirname(files[i].fsPath));
                const projectName = basename(dirPath);

                const solutionFiles = await vscode.workspace.findFiles(dirPath + '/*/*.aps', undefined, 10);
                const solutions = solutionFiles.map(f => new SolutionInfo(basename(dirname(f.fsPath))));

                this._projects.push(new ProjectInfo(projectName, dirPath, solutions));
                OutputConsole.instance.appendLine('+ Added project: [' + projectName + '] at ' + dirPath);
            }
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
    public name: string;
    public path: string;
    public readonly solutions: SolutionInfo[];

    constructor(name: string, path: string, solutions: SolutionInfo[]) {
        this.name = name;
        this.path = path;
        this.solutions = solutions;
    }
}

export class SolutionInfo {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }
}