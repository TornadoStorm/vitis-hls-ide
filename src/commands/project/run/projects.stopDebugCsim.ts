import * as vscode from 'vscode';
import { HLSProject } from '../../../models/hlsProject';
import { HLSProjectSolution } from '../../../models/hlsProjectSolution';

export default async (project: HLSProject, solution: HLSProjectSolution) => {
    vscode.debug.stopDebugging();
};