import * as vscode from 'vscode';
import { SolutionInfo } from '../../../projectManager';

export default async (solution: SolutionInfo) => {
    vscode.debug.stopDebugging();
};