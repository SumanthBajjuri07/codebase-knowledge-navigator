"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const codeMapGenerator_1 = require("./codeMapGenerator");
const webviewPanel_1 = require("./webviewPanel");
function activate(context) {
    console.log('Codebase Knowledge Navigator is now active!');
    let disposable = vscode.commands.registerCommand('codebase-knowledge-navigator.generateCodeMap', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        const rootPath = workspaceFolders[0].uri.fsPath;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating Code Map",
            cancellable: false
        }, async (progress) => {
            const codeMapGenerator = new codeMapGenerator_1.CodeMapGenerator(rootPath, progress);
            const codeMap = await codeMapGenerator.generateCodeMap();
            const panel = (0, webviewPanel_1.createWebviewPanel)(context.extensionUri);
            panel.webview.postMessage({ command: 'updateCodeMap', codeMap });
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map