import * as vscode from 'vscode';
import * as path from 'path';

export function createWebviewPanel(extensionUri: vscode.Uri): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
        'codeMapView',
        'Code Map',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        }
    );

    const mediaPath = vscode.Uri.joinPath(extensionUri, 'media');
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'main.js'));

    panel.webview.html = getWebviewContent(scriptUri);

    return panel;
}

function getWebviewContent(scriptUri: vscode.Uri): string {
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