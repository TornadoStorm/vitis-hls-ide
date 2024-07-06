import vscode from 'vscode';

export class HLSProjectFile {
    public name: string;
    public sc: string;
    public tb: boolean;
    public cflags: string;
    public csimflags: string;
    public blackbox: boolean;

    constructor(name: string, sc: string, tb: boolean, cflags: string, csimflags: string, blackbox: boolean) {
        this.name = name;
        this.sc = sc;
        this.tb = tb;
        this.cflags = cflags;
        this.csimflags = csimflags;
        this.blackbox = blackbox;
    }

    public getUri(projectUri: vscode.Uri): vscode.Uri {
        return vscode.Uri.joinPath(projectUri, "..", this.tb ? this.name.replace("../../", "") : this.name);
    }

    static fromJson(json: any): HLSProjectFile {
        return new HLSProjectFile(json.name, json.sc, json.tb === '1', json.cflags, json.csimflags, json.blackbox === '1');
    }
}