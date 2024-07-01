import path from 'path';
import * as vscode from 'vscode';
import { HLSProject } from '../models/hlsProject';
import { HLSProjectFile } from '../models/hlsProjectFile';
import { HLSProjectSolution } from '../models/hlsProjectSolution';
import ProjectManager from '../projectManager';

const startIconPath = new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('debugIcon.startForeground'));
const stopIconPath = new vscode.ThemeIcon('debug-stop', new vscode.ThemeColor('debugIcon.stopForeground'));
const loadingIconPath = new vscode.ThemeIcon('loading~spin');

class TreeItem extends vscode.TreeItem {
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None) {
        super(label, collapsibleState);
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([]);
    }
}

class ProjectTreeItem extends TreeItem {
    public readonly project: HLSProject;

    private readonly _sourceItem: ProjectSourceItem;
    private readonly _testBenchItem: ProjectTestBenchItem;
    private readonly _solutionItems: SolutionTreeItem[] = [];

    constructor(project: HLSProject) {
        super(project.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.project = project;
        this.label = project.name;
        this.tooltip = project.uri.fsPath;
        this.resourceUri = project.uri;

        this._sourceItem = new ProjectSourceItem(this.project);
        this._testBenchItem = new ProjectTestBenchItem(this.project);
        this._solutionItems.push(...this.project.solutions.map(s => new SolutionTreeItem(this.project, s)));
    }

    public getChildren(): Thenable<TreeItem[]> {
        // Update solutions
        const newSolutions = this.project.solutions;
        // Add new solutions
        for (const solution of newSolutions) {
            if (this._solutionItems.some(s => s.solution === solution)) {
                continue; // Already exists
            } else {
                this._solutionItems.push(new SolutionTreeItem(this.project, solution));
            }
        }

        // Remove solutions that no longer exist
        this._solutionItems.forEach(item => {
            if (!newSolutions.some(s => s === item.solution)) {
                this._solutionItems.splice(this._solutionItems.indexOf(item), 1);
            }
        });

        this._solutionItems.sort((a, b) => a.solution.name.localeCompare(b.solution.name));

        return Promise.resolve([
            this._sourceItem,
            this._testBenchItem,
            ...this._solutionItems
        ]);
    }
}

export class ProjectFileItem extends TreeItem {
    public readonly project: HLSProject;

    constructor(file: HLSProjectFile, project: HLSProject) {
        super(path.basename(file.name));
        this.project = project;
        this.resourceUri = file.getUri(project.uri);
        this.contextValue = file.tb ? 'projectTestBenchFileItem' : 'projectSourceFileItem';
        this.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [this.resourceUri]
        };
    }
}

export class ProjectSourceItem extends TreeItem {
    public readonly project: HLSProject;

    constructor(project: HLSProject) {
        super("Source", vscode.TreeItemCollapsibleState.Collapsed);
        this.project = project;
        this.resourceUri = vscode.Uri.file("src");
        this.contextValue = 'projectSourceItem';
    }

    public getChildren(): Thenable<ProjectFileItem[]> {
        return Promise.resolve(this.project.files
            .filter(f => !f.tb)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(f => new ProjectFileItem(f, this.project)));
    }
}

export class ProjectTestBenchItem extends TreeItem {
    public readonly project: HLSProject;

    constructor(project: HLSProject) {
        super("Test Bench", vscode.TreeItemCollapsibleState.Collapsed);
        this.project = project;
        this.resourceUri = vscode.Uri.file("test");
        this.contextValue = 'projectTestBenchItem';
    }

    public getChildren(): Thenable<ProjectFileItem[]> {
        return Promise.resolve(this.project.files
            .filter(f => f.tb)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(f => new ProjectFileItem(f, this.project)));
    }
}

class SolutionTreeItem extends TreeItem {
    private readonly _project: HLSProject;
    public readonly solution: HLSProjectSolution;

    constructor(project: HLSProject, solution: HLSProjectSolution) {
        super(solution.name, vscode.TreeItemCollapsibleState.Expanded);
        this.iconPath = new vscode.ThemeIcon('folder');
        this._project = project;
        this.solution = solution;
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new CsimTreeItem(this._project, this.solution),
            new CsynthTreeItem(this._project, this.solution),
            new CosimTreeItem(this._project, this.solution)
        ]);
    }
}

class CsimTreeItem extends TreeItem {
    private _project: HLSProject;
    private _solution: HLSProjectSolution;

    constructor(project: HLSProject, solution: HLSProjectSolution) {
        super("C SIMULATION", vscode.TreeItemCollapsibleState.Expanded);
        this._project = project;
        this._solution = solution;
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new RunCsimTreeItem(this._project, this._solution),
        ]);
    }
}

class RunCsimTreeItem extends TreeItem {
    private _project: HLSProject;
    private _solution: HLSProjectSolution;
    constructor(project: HLSProject, solution: HLSProjectSolution) {
        const title = 'Run C Simulation';

        super(title);
        this._project = project;
        this._solution = solution;

        if (vscode.tasks.taskExecutions.some(e => e.task.name === this._solution.buildCsimTaskName(project)) ||
            vscode.debug.activeDebugSession?.name === this._solution.debugCsimTaskName(project)) {
            this.iconPath = stopIconPath;
            this.command = {
                title: `Stop ${title}`,
                command: 'vitis-hls-ide.projects.stopCsim',
                arguments: [this._project, this._solution]
            };
        } else if (vscode.tasks.taskExecutions.some(e => e.task.source === "Vitis HLS IDE") || vscode.debug.activeDebugSession) {
            this.iconPath = loadingIconPath;
        } else {
            this.iconPath = startIconPath;
            this.command = {
                title: title,
                command: 'vitis-hls-ide.projects.runCsim',
                arguments: [this._project, this._solution]
            };
        }
    }
}

class CsynthTreeItem extends TreeItem {
    private _project: HLSProject;
    private _solution: HLSProjectSolution;

    constructor(project: HLSProject, solution: HLSProjectSolution) {
        super("C SYNTHESIS", vscode.TreeItemCollapsibleState.Expanded);
        this._project = project;
        this._solution = solution;
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new RunCsynthTreeItem(this._project, this._solution),
        ]);
    }
}

class RunCsynthTreeItem extends TreeItem {
    private _project: HLSProject;
    private _solution: HLSProjectSolution;
    constructor(project: HLSProject, solution: HLSProjectSolution) {
        const title = 'Run C Synthesis';

        super(title);
        this._project = project;
        this._solution = solution;

        if (vscode.tasks.taskExecutions.some(e => e.task.name === this._solution.csynthTaskName(project))) {
            this.iconPath = stopIconPath;
            this.command = {
                title: `Stop ${title}`,
                command: 'vitis-hls-ide.projects.stopCsynth',
                arguments: [this._project, this._solution]
            };
        } else if (vscode.tasks.taskExecutions.some(e => e.task.source === "Vitis HLS IDE") || vscode.debug.activeDebugSession) {
            this.iconPath = loadingIconPath;
        } else {
            this.iconPath = startIconPath;
            this.command = {
                title: title,
                command: 'vitis-hls-ide.projects.runCsynth',
                arguments: [this._project, this._solution]
            };
        }
    }
}

class CosimTreeItem extends TreeItem {
    private _project: HLSProject;
    private _solution: HLSProjectSolution;

    constructor(project: HLSProject, solution: HLSProjectSolution, collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded) {
        super("C/RTL COSIMULATION", collapsibleState);
        this._project = project;
        this._solution = solution;
    }

    public getChildren(): Thenable<TreeItem[]> {
        return Promise.resolve([
            new RunCosimTreeItem(this._project, this._solution),
        ]);
    }
}

class RunCosimTreeItem extends TreeItem {
    private _project: HLSProject;
    private _solution: HLSProjectSolution;
    constructor(project: HLSProject, solution: HLSProjectSolution) {
        const title = 'Run Cosimulation';

        super(title);
        this._project = project;
        this._solution = solution;

        if (vscode.tasks.taskExecutions.some(e => e.task.name === this._solution.cosimTaskName(project))) {
            this.iconPath = stopIconPath;
            this.command = {
                title: `Stop ${title}`,
                command: 'vitis-hls-ide.projects.stopCosim',
                arguments: [this._project, this._solution]
            };
        } else if (vscode.tasks.taskExecutions.some(e => e.task.source === "Vitis HLS IDE") || vscode.debug.activeDebugSession) {
            this.iconPath = loadingIconPath;
        } else {
            this.iconPath = startIconPath;
            this.command = {
                title: title,
                command: 'vitis-hls-ide.projects.runCosim',
                arguments: [this._project, this._solution]
            };
        }
    }
}

export default class ProjectsViewTreeProvider implements vscode.TreeDataProvider<TreeItem> {

    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
    public readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private _disposables: vscode.Disposable[] = [];
    private readonly _children: ProjectTreeItem[] = [];

    constructor() {
        ProjectManager.instance.on('projectsChanged', () => this._onDidChangeTreeData.fire());
        this._disposables = [
            vscode.tasks.onDidStartTask(() => this._onDidChangeTreeData.fire()),
            vscode.tasks.onDidEndTask(() => this._onDidChangeTreeData.fire()),
            vscode.debug.onDidChangeActiveDebugSession(() => this._onDidChangeTreeData.fire()),
        ];
    }

    getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        if (element) {
            return element.getChildren();
        } else {
            const newProjects = await ProjectManager.instance.getProjects();

            // Add new projects
            for (const project of newProjects) {
                if (this._children.some(p => p.project.uri.toString() === project.uri.toString())) {
                    continue; // Already exists
                } else {
                    this._children.push(new ProjectTreeItem(project));
                }
            }

            // Remove projects that no longer exist
            this._children.forEach(child => {
                if (!newProjects.some(p => p.uri.toString() === child.project.uri.toString())) {
                    this._children.splice(this._children.indexOf(child), 1);
                }
            });

            this._children.sort((a, b) => a.project.name.localeCompare(b.project.name));

            return this._children;
        }
    }

    public dispose() {
        this._onDidChangeTreeData.dispose();
        this._disposables.forEach(d => d.dispose());
    }
}
