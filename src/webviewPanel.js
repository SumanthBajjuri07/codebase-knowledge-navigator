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
exports.createWebviewPanel = createWebviewPanel;
const vscode = __importStar(require("vscode"));
function createWebviewPanel(extensionUri) {
    const panel = vscode.window.createWebviewPanel('codeMapView', 'Code Map', vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    });
    const mediaPath = vscode.Uri.joinPath(extensionUri, 'media');
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'main.js'));
    panel.webview.html = getWebviewContent(scriptUri);
    return panel;
}
function getWebviewContent(scriptUri) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Map</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f0f0f0;
                }
                #codeMap {
                    width: 100%;
                    height: 100vh;
                    overflow: auto;
                }
                .node circle {
                    fill: #fff;
                    stroke: steelblue;
                    stroke-width: 3px;
                }
                .node text {
                    font: 12px sans-serif;
                }
                .link {
                    fill: none;
                    stroke: #ccc;
                    stroke-width: 2px;
                }
                .tooltip {
                    position: absolute;
                    text-align: center;
                    padding: 8px;
                    font: 12px sans-serif;
                    background: #f9f9f9;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
            </style>
        </head>
        <body>
            <div id="codeMap"></div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/6.7.0/d3.min.js"></script>
            <script src="${scriptUri}"></script>
        </body>
        </html>
    `;
}
//# sourceMappingURL=webviewPanel.js.map