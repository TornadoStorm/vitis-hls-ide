import * as vscode from 'vscode';
import ProjectManager, { ProjectInfo, SolutionInfo } from '../projectManager';

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
            new CsimTreeItem(),
            new CsynthTreeItem(),
            new CosimTreeItem()
        ]);
    }
}

class CsimTreeItem extends TreeItem {
    constructor() {
        super('Run C Simulation');
        // this.iconPath = new vscode.ThemeIcon('loading~spin');
        this.iconPath = new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('debugIcon.startForeground'));
    }
}

class CsynthTreeItem extends TreeItem {
    constructor() {
        super('Run C Synthesis');
        // this.iconPath = new vscode.ThemeIcon('loading~spin');
        this.iconPath = new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('debugIcon.startForeground'));
    }
}

class CosimTreeItem extends TreeItem {
    constructor() {
        super('Run Cosimulation');
        // this.iconPath = new vscode.ThemeIcon('loading~spin');
        this.iconPath = new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('debugIcon.startForeground'));
    }
}

export default class ProjectsViewTreeProvider implements vscode.TreeDataProvider<TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor() {
        ProjectManager.instance.on('projectsChanged', () => this._onDidChangeTreeData.fire());

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
    }
}
