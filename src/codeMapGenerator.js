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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fileParser_1 = require("./fileParser");
class CodeMapGenerator {
    rootPath;
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    generateCodeMap() {
        const codeMap = {
            name: path.basename(this.rootPath),
            type: 'directory',
            children: this.processDirectory(this.rootPath)
        };
        return codeMap;
    }
    processDirectory(dirPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const result = [];
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
            }
            else if (this.isRelevantFile(entry.name)) {
                const fileInfo = (0, fileParser_1.parseFile)(fullPath);
                result.push({
                    name: entry.name,
                    type: 'file',
                    ...fileInfo
                });
            }
        }
        return result;
    }
    isRelevantFile(fileName) {
        const relevantExtensions = ['.ts', '.js', '.tsx', '.jsx'];
        return relevantExtensions.includes(path.extname(fileName));
    }
}
exports.CodeMapGenerator = CodeMapGenerator;
//# sourceMappingURL=codeMapGenerator.js.map