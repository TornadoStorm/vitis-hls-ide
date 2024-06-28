import fs from 'fs';
import os from 'os';
import path from 'path';
import { EventEmitter } from 'stream';
import * as vscode from 'vscode';
import { OutputConsole } from './outputConsole';
import { vitisRun } from './utils/vitisRun';

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
            const tempFileName = `vitis-hls-ide-search-${Date.now()}.txt`;
            const tempFilePath = path.join(os.tmpdir(), tempFileName);
            for (let i = 0; i < files.length; i++) {
                const absoluteDirPath = vscode.Uri.joinPath(files[i], '..');
                const project = new ProjectInfo(absoluteDirPath);

                const fetchProjectInfoTclContent =
                    `open_project ${project.name}\n` +
                    `set solutions [get_project -solutions]\n` +
                    `set files [get_files]\n` +
                    `set testBench [get_files -tb]\n` +
                    `set outputFile [open "${tempFilePath.replaceAll('\\', '\\\\')}" "w"]\n` +
                    `puts $outputFile "\\[solutions\\]"\n` +
                    `foreach solution $solutions { puts $outputFile $solution }\n` +
                    `puts $outputFile "\\[source\\]"\n` +
                    `foreach file $files { puts $outputFile $file }\n` +
                    `puts $outputFile "\\[testbench\\]"\n` +
                    `foreach tb $testBench { puts $outputFile $tb }\n` +
                    `exit`;

                // Find sources
                const executeLocation = vscode.Uri.joinPath(absoluteDirPath, "..");
                const fetchProjectInfoExitCode = await vitisRun(executeLocation, fetchProjectInfoTclContent, `Fetch project info for ${project.name}`, {
                    reveal: vscode.TaskRevealKind.Silent, close: true
                });
                if (fetchProjectInfoExitCode !== 0) {
                    vscode.window.showErrorMessage(`Failed to fetch project info for ${project.name} with exit code ${fetchProjectInfoExitCode}`);
                    continue;
                }

                try {
                    const results = fs.readFileSync(tempFilePath, 'utf8').split('\n');
                    fs.unlinkSync(tempFilePath);

                    let readMode: 'solutions' | 'source' | 'testbench' = 'solutions';
                    const solutionNames: string[] = [];
                    const sources: vscode.Uri[] = [];
                    const testbenches: vscode.Uri[] = [];

                    results.forEach(line => {
                        line = line.replace(/[\r\n]+/g, "");
                        switch (line) {
                            case '':
                                return;
                            case '[solutions]':
                                readMode = 'solutions';
                                return;
                            case '[source]':
                                readMode = 'source';
                                return;
                            case '[testbench]':
                                readMode = 'testbench';
                                return;
                            default:
                                switch (readMode) {
                                    case 'solutions':
                                        solutionNames.push(line);
                                        break;
                                    case 'source':
                                        sources.push(vscode.Uri.joinPath(executeLocation, line));
                                        break;
                                    case 'testbench':
                                        testbenches.push(vscode.Uri.joinPath(executeLocation, line));
                                        break;
                                }
                        }
                    });

                    project.solutions.push(...solutionNames.map(name => new SolutionInfo(name, project)));
                    project.sources.push(...sources);
                    project.testbenches.push(...testbenches);

                    this._projects.push(project);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to read project info for ${project.name}: ${error}`);
                    continue;
                }
            }

            OutputConsole.instance.appendLine('Found ' + this._projects.length + ' HLS project(s)');
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
    public readonly uri: vscode.Uri;
    public readonly sources: vscode.Uri[];
    public readonly testbenches: vscode.Uri[];
    public solutions: SolutionInfo[];

    constructor(uri: vscode.Uri, solutions: SolutionInfo[] = [], sources: vscode.Uri[] = [], testbenches: vscode.Uri[] = []) {
        this.name = path.basename(uri.fsPath);
        this.uri = uri;
        this.solutions = solutions;
        this.sources = sources;
        this.testbenches = testbenches;

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

    public get uri(): vscode.Uri {
        return vscode.Uri.joinPath(this.project.uri, this.name);
    }

    constructor(name: string, project: ProjectInfo) {
        this.name = name;
        this.project = project;

        const id = path.join(this.project.uri.fsPath, this.name);
        this.debugCsimTaskName = `Debug C simulation for ${id}`;
        this.csimTaskName = `C simulation for ${id}`;
        this.csynthTaskName = `C synthesis for ${id}`;
        this.cosimTaskName = `Cosimulation for ${id}`;
    }
}