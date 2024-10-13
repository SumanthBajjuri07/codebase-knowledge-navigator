import * as fs from 'fs';
import * as path from 'path';
import { parseFile } from './fileParser';

export class CodeMapGenerator {
    private rootPath: string;

    constructor(rootPath: string) {
        this.rootPath = rootPath;
    }

    generateCodeMap(): any {
        const codeMap: any = {
            name: path.basename(this.rootPath),
            type: 'directory',
            children: this.processDirectory(this.rootPath)
        };
        return codeMap;
    }

    private processDirectory(dirPath: string): any[] {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const result: any[] = [];

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.name === 'node_modules') {
                continue; // Skip node_modules directory
            }
            if (entry.isDirectory()) {
                const children = this.processDirectory(fullPath);
                if (children.length > 0) {
                    result.push({
                        name: entry.name,
                        type: 'directory',
                        children: children
                    });
                }
            } else if (this.isRelevantFile(entry.name)) {
                const fileInfo = parseFile(fullPath);
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
}