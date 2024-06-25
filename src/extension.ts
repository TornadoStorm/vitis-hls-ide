import * as vscode from 'vscode';
import { OutputConsole } from './outputConsole';
import ProjectManager from './projectManager';
import ProjectsViewTreeProvider from './views/projects-tree';

export function activate(context: vscode.ExtensionContext) {
	OutputConsole.instance.appendLine('Vitis HLS IDE extension activated');

	let refreshCommand = vscode.commands.registerCommand('vitis-hls-ide.projects.refresh', () => ProjectManager.instance.refresh());

	let projectsViewProvider = new ProjectsViewTreeProvider();
	vscode.window.registerTreeDataProvider('projectsView', projectsViewProvider);

	context.subscriptions.push(refreshCommand);
	context.subscriptions.push(projectsViewProvider);
	context.subscriptions.push(OutputConsole.instance);
	context.subscriptions.push(ProjectManager.instance);
}

export function deactivate() {
}
