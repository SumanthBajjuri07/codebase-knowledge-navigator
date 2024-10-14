import * as fs from 'fs/promises'; // Use the async version of 'fs'
import * as path from 'path';
import { Worker } from 'worker_threads';
import * as vscode from 'vscode';

export class CodeMapGenerator {
    private rootPath: string;
    private progress: vscode.Progress<{ message?: string, increment?: number }>;

    constructor(rootPath: string, progress: vscode.Progress<{ message?: string, increment?: number }>) {
        this.rootPath = rootPath;
        this.progress = progress;
    }

    async generateCodeMap(): Promise<any> {
        this.progress.report({ message: 'Initializing Code Map generation...' });
        
        const codeMap: any = {
            name: path.basename(this.rootPath),
            type: 'directory',
            children: await this.processDirectory(this.rootPath)
        };

        this.progress.report({ message: 'Code Map generation complete!', increment: 100 });
        return codeMap;
    }

    private async processDirectory(dirPath: string): Promise<any[]> {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const result: any[] = [];

        for (const entry of entries) {
            // Explicitly skip the 'node_modules' directory
            if (entry.isDirectory() && entry.name === 'node_modules') {
                continue; // Skip node_modules directory entirely
            }

            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                const children = await this.processDirectory(fullPath);
                if (children.length > 0) {
                    result.push({
                        name: entry.name,
                        type: 'directory',
                        children: children
                    });
                }
            } else if (this.isRelevantFile(entry.name)) {
                const fileInfo = await this.parseFileUsingWorker(fullPath);
                result.push({
                    name: entry.name,
                    type: 'file',
                    ...fileInfo
                });
            }
        }

        return result;
    }

    private isRelevantFile(fileName: string): boolean {
        const relevantExtensions = ['.ts', '.js', '.tsx', '.jsx'];
        return relevantExtensions.includes(path.extname(fileName));
    }

    private async parseFileUsingWorker(filePath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.resolve(__dirname, 'fileParseWorker.js'), {
                workerData: { filePath }
            });

            worker.on('message', (fileInfo) => resolve(fileInfo));
            worker.on('error', (error) => reject(error));
            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }
}
