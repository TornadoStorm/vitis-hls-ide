import * as vscode from 'vscode';
import ProjectManager, { ProjectInfo, SolutionInfo } from '../projectManager';

const startIconPath = new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('debugIcon.startForeground'));
const debugIconPath = new vscode.ThemeIcon('debug', new vscode.ThemeColor('debugIcon.startForeground'));
const stopIconPath = new vscode.ThemeIcon('debug-stop', new vscode.ThemeColor('debugIcon.stopForeground'));
const loadingIconPath = new vscode.ThemeIcon('loading~spin');

abstract class TreeItem extends vscode.TreeItem {
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None) {
        super(label, collapsibleState);
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([]);
    }
}

class ProjectTreeItem extends TreeItem {
    private readonly _project: ProjectInfo;

    constructor(project: ProjectInfo, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded) {
        super(project.name, collapsibleState);
        this._project = project;
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve(this._project.solutions.map(s => new SolutionTreeItem(s)));
    }
}

class SolutionTreeItem extends TreeItem {
    private _solution: SolutionInfo;

    constructor(solution: SolutionInfo, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded) {
        super(solution.name, collapsibleState);
        this.iconPath = new vscode.ThemeIcon('folder');
        this._solution = solution;
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new CsimTreeItem(this._solution),
            new CsynthTreeItem(this._solution),
            new CosimTreeItem(this._solution)
        ]);
    }
}

class CsimTreeItem extends TreeItem {
    private _solution: SolutionInfo;

    constructor(solution: SolutionInfo, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded) {
        super("C SIMULATION", collapsibleState);
        this._solution = solution;
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new RunCsimTreeItem(this._solution),
            new DebugCsimTreeItem(this._solution)
        ]);
    }
}

class RunCsimTreeItem extends TreeItem {
    private _solution: SolutionInfo;
    constructor(solution: SolutionInfo) {
        const title = 'Run C Simulation';

        super(title);
        this._solution = solution;

        if (vscode.tasks.taskExecutions.some(e => e.task.name === this._solution.csimTaskName)) {
            this.iconPath = stopIconPath;
        } else if (vscode.tasks.taskExecutions.some(e => e.task.source === "Vitis HLS IDE")) {
            this.iconPath = loadingIconPath;
        } else {
            this.iconPath = startIconPath;
            this.command = {
                title: title,
                command: 'vitis-hls-ide.projects.runCsim',
                arguments: [this._solution]
            };
        }
    }
}

class DebugCsimTreeItem extends TreeItem {
    private _solution: SolutionInfo;
    constructor(solution: SolutionInfo) {
        const title = 'Debug C Simulation';

        super(title);
        this._solution = solution;

        // TODO: Figure this out
        this.iconPath = debugIconPath;
        this.command = {
            title: title,
            command: 'vitis-hls-ide.projects.debugCsim',
            arguments: [this._solution]
        };
    }
}

class CsynthTreeItem extends TreeItem {
    private _solution: SolutionInfo;

    constructor(solution: SolutionInfo, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded) {
        super("C SYNTHESIS", collapsibleState);
        this._solution = solution;
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new RunCsynthTreeItem(this._solution),
        ]);
    }
}

class RunCsynthTreeItem extends TreeItem {
    private _solution: SolutionInfo;
    constructor(solution: SolutionInfo) {
        const title = 'Run C Synthesis';

        super(title);
        this._solution = solution;

        if (vscode.tasks.taskExecutions.some(e => e.task.name === this._solution.csynthTaskName)) {
            this.iconPath = stopIconPath;
        } else if (vscode.tasks.taskExecutions.some(e => e.task.source === "Vitis HLS IDE")) {
            this.iconPath = loadingIconPath;
        } else {
            this.iconPath = startIconPath;
            this.command = {
                title: title,
                command: 'vitis-hls-ide.projects.runCsynth',
                arguments: [this._solution]
            };
        }
    }
}

class CosimTreeItem extends TreeItem {
    private _solution: SolutionInfo;

    constructor(solution: SolutionInfo, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded) {
        super("C/RTL COSIMULATION", collapsibleState);
        this._solution = solution;
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new RunCosimTreeItem(this._solution),
        ]);
    }
}

class RunCosimTreeItem extends TreeItem {

    private _solution: SolutionInfo;
    constructor(solution: SolutionInfo) {
        const title = 'Run Cosimulation';

        super(title);
        this._solution = solution;

        if (vscode.tasks.taskExecutions.some(e => e.task.name === this._solution.cosimTaskName)) {
            this.iconPath = stopIconPath;
        } else if (vscode.tasks.taskExecutions.some(e => e.task.source === "Vitis HLS IDE")) {
            this.iconPath = loadingIconPath;
        } else {
            this.iconPath = startIconPath;
            this.command = {
                title: title,
                command: 'vitis-hls-ide.projects.runCosim',
                arguments: [this._solution]
            };
        }
    }
}

export default class ProjectsViewTreeProvider implements vscode.TreeDataProvider<TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    disposables: vscode.Disposable[] = [];

    constructor() {
        ProjectManager.instance.on('projectsChanged', () => this._onDidChangeTreeData.fire());
        this.disposables = [
            vscode.tasks.onDidStartTask(() => this._onDidChangeTreeData.fire()),
            vscode.tasks.onDidEndTask(() => this._onDidChangeTreeData.fire()),
        ];
    }

    getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (element) {
            return element.getChildren();
        } else {
            return Promise.resolve(ProjectManager.instance.projects.map(p => new ProjectTreeItem(p)));
        }
    }

    public dispose() {
        this._onDidChangeTreeData.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}
