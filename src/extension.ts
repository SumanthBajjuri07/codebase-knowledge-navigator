import * as vscode from 'vscode';
import { CodeMapGenerator } from './codeMapGenerator';
import { createWebviewPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Codebase Knowledge Navigator is now active!');

    let disposable = vscode.commands.registerCommand('codebase-knowledge-navigator.generateCodeMap', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const codeMapGenerator = new CodeMapGenerator(rootPath);
        const codeMap = codeMapGenerator.generateCodeMap();

        const panel = createWebviewPanel(context.extensionUri);
        panel.webview.postMessage({ command: 'updateCodeMap', codeMap });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}