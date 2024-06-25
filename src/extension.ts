import * as vscode from 'vscode';
import debugCsim from './commands/projects.debugCsim';
import runCosim from './commands/projects.runCosim';
import runCsim from './commands/projects.runCsim';
import runCsynth from './commands/projects.runCsynth';
import { OutputConsole } from './outputConsole';
import ProjectManager from './projectManager';
import ProjectsViewTreeProvider from './views/projects-tree';

export function activate(context: vscode.ExtensionContext) {
	OutputConsole.instance.appendLine('Vitis HLS IDE extension activated');

	let projectsViewProvider = new ProjectsViewTreeProvider();
	vscode.window.registerTreeDataProvider('projectsView', projectsViewProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('vitis-hls-ide.projects.refresh', () => ProjectManager.instance.refresh()),
		vscode.commands.registerCommand('vitis-hls-ide.projects.debugCsim', debugCsim),
		vscode.commands.registerCommand('vitis-hls-ide.projects.runCosim', runCosim),
		vscode.commands.registerCommand('vitis-hls-ide.projects.runCsim', runCsim),
		vscode.commands.registerCommand('vitis-hls-ide.projects.runCsynth', runCsynth),
		projectsViewProvider,
		OutputConsole.instance,
		ProjectManager.instance,
	);

	// TODO check include paths in c_cpp_properties.json
}

export function deactivate() {
}