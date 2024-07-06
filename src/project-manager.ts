import { EventEmitter } from 'stream';
import * as vscode from 'vscode';
import { HLSProject } from './models/hls-project';
import { OutputConsole } from './output-console';

type ProjectManagerEvents = { 'projectsChanged': [] };

export default class ProjectManager extends EventEmitter<ProjectManagerEvents> {
    static #instance: ProjectManager;
    public readonly projects: HLSProject[] = [];
    private _queueRefresh: boolean = false;
    private _refreshing: boolean = false;

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

    public async getProjects(): Promise<HLSProject[]> {
        while (this._refreshing) {
            await new Promise(resolve => this.once('projectsChanged', () => resolve(void 0)));
        }

        return this.projects;
    }

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

        const newProjects: HLSProject[] = [];

        const files = await vscode.workspace.findFiles('**/hls.app', '**/node_modules/**', 10);

        if (files.length > 0) {
            await Promise.all(files.map(file =>
                HLSProject.fromFile(file).then(
                    project => newProjects.push(project),
                    error => OutputConsole.instance.appendLine('Error loading project: ' + error.message)
                )
            ));

            // Add new projects, update existing projects
            for (const newProject of newProjects) {
                const existingProject = this.projects.find(project => project.uri.path === newProject.uri.path);

                if (existingProject) {
                    existingProject.update(newProject);
                } else {
                    this.projects.push(newProject);
                }
            }

            // Remove projects that no longer exist
            for (let i = this.projects.length - 1; i >= 0; i--) {
                const project = this.projects[i];
                if (!newProjects.find(newProject => newProject.uri.path === project.uri.path)) {
                    this.projects.splice(i, 1);
                }
            }

            OutputConsole.instance.appendLine('Found ' + this.projects.length + ' HLS project(s)');
        } else {
            this.projects.length = 0;
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