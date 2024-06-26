import path from 'path';
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

	checkCppProperties();

	context.subscriptions.push(
		vscode.commands.registerCommand('vitis-hls-ide.projects.refresh', () => ProjectManager.instance.refresh()),
		vscode.commands.registerCommand('vitis-hls-ide.projects.debugCsim', debugCsim),
		vscode.commands.registerCommand('vitis-hls-ide.projects.runCosim', runCosim),
		vscode.commands.registerCommand('vitis-hls-ide.projects.runCsim', runCsim),
		vscode.commands.registerCommand('vitis-hls-ide.projects.runCsynth', runCsynth),
		projectsViewProvider,
		OutputConsole.instance,
		ProjectManager.instance,
		// Check CPP properties for HLS path when the cpp properties file is changed
		vscode.workspace.onDidChangeTextDocument((e) => {
			const cppPropertiesPath = vscode.workspace.workspaceFolders ?
				path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.vscode', 'c_cpp_properties.json') : null;
			if (cppPropertiesPath && e.document.uri.fsPath === vscode.Uri.file(cppPropertiesPath).fsPath) {
				checkCppProperties();
			}
		})
	);
}

export function deactivate() {
}

function checkCppProperties() {
	const hlsConfig = vscode.workspace.getConfiguration('vitis-hls-ide');
	const hlsPath = hlsConfig.get<string>('hlsPath');

	if (hlsPath === undefined || hlsPath === '') {
		vscode.window.showWarningMessage('Vitis HLS path not set. Please set the path to Vitis HLS in the settings', 'Take me there').then((selection) => {
			if (selection === 'Take me there') {
				vscode.commands.executeCommand('workbench.action.openSettings', 'vitisHls.hlsPath');
			}
		});
		return;
	}

	const cppPropertiesPath = vscode.workspace.workspaceFolders ?
		path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.vscode', 'c_cpp_properties.json') : null;

	if (cppPropertiesPath) {
		vscode.workspace.fs.readFile(vscode.Uri.file(cppPropertiesPath))
			.then((data) => {
				let configContent: any;
				try {
					configContent = JSON.parse(Buffer.from(data).toString());
				} catch (e) {
					return; // This shit broken, not my problem!
				}

				const configurations: { includePath: string[] }[] = configContent.configurations;

				const includePath = path.join(hlsPath, 'include', '**');

				if (configurations.some((config: { includePath: string[]; }) => !config.includePath.includes(includePath))) {
					vscode.window.showWarningMessage('HLS path is not included in one or more configurations in your C++ properties. Would you like to add it?', 'Add')
						.then(selection => {
							if (selection === 'Add') {
								configurations.forEach((config: { includePath: string[]; }) => {
									if (!config.includePath.includes(includePath)) {
										config.includePath.push(includePath);
									}
								});

								vscode.workspace.fs.writeFile(vscode.Uri.file(cppPropertiesPath), Buffer.from(JSON.stringify(configContent, null, 4)))
									.then(() => {
										vscode.window.showInformationMessage('HLS path added to C++ properties');
									});
							}
						});
				}
			}, (err) => {
				console.error(err);
			});
	}
}