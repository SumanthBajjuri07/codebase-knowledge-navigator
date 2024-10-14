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
exports.CodeMapGenerator = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const worker_threads_1 = require("worker_threads");
class CodeMapGenerator {
    rootPath;
    progress;
    constructor(rootPath, progress) {
        this.rootPath = rootPath;
        this.progress = progress;
    }
    async generateCodeMap() {
        this.progress.report({ message: 'Initializing Code Map generation...' });
        const codeMap = {
            name: path.basename(this.rootPath),
            type: 'directory',
            children: await this.processDirectory(this.rootPath)
        };
        this.progress.report({ message: 'Code Map generation complete!', increment: 100 });
        return codeMap;
    }
    async processDirectory(dirPath) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const result = [];
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (this.shouldExclude(fullPath)) {
                continue;
            }
            if (entry.isDirectory()) {
                const children = await this.processDirectory(fullPath);
                if (children.length > 0) {
                    result.push({
                        name: entry.name,
                        type: 'directory',
                        children: children
                    });
                }
            }
            else if (this.isRelevantFile(entry.name)) {
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
    shouldExclude(filePath) {
        const excludePatterns = [
            /node_modules/,
            /\.git/,
            /test/,
            /tests/,
            /__tests__/,
            /\.test\./,
            /\.spec\./,
            /\.vscode/,
            /\.idea/,
            /dist/,
            /build/,
            /\.DS_Store/
        ];
        return excludePatterns.some(pattern => pattern.test(filePath));
    }
    isRelevantFile(fileName) {
        const relevantExtensions = ['.tsx', '.jsx'];
        return relevantExtensions.includes(path.extname(fileName));
    }
    async parseFileUsingWorker(filePath) {
        return new Promise((resolve, reject) => {
            const worker = new worker_threads_1.Worker(path.resolve(__dirname, 'fileParseWorker.js'), {
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
exports.CodeMapGenerator = CodeMapGenerator;
//# sourceMappingURL=codeMapGenerator.js.map