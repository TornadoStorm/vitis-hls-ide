import path from 'path';
import { HLSProject } from './hls-project';

enum HLSProjectSolutionStatus {
    active,
    inactive,
}

export class HLSProjectSolution {
    public name: string;
    public status: HLSProjectSolutionStatus;

    constructor(name: string, status: HLSProjectSolutionStatus = HLSProjectSolutionStatus.active) {
        this.name = name;
        this.status = status;
    }

    public debugCsimTaskName(project: HLSProject): string {
        return `Debug C simulation for ${path.join(project.uri.fsPath, this.name)}`;
    }

    public buildCsimTaskName(project: HLSProject): string {
        return `C simulation for ${path.join(project.uri.fsPath, this.name)}`;
    }

    public csynthTaskName(project: HLSProject): string {
        return `C synthesis for ${path.join(project.uri.fsPath, this.name)}`;
    }

    public cosimTaskName(project: HLSProject): string {
        return `Cosimulation for ${path.join(project.uri.fsPath, this.name)}`;
    }

    static fromJson(json: any): HLSProjectSolution {
        return new HLSProjectSolution(json.name, HLSProjectSolutionStatus[json.status as keyof typeof HLSProjectSolutionStatus]);
    }
}