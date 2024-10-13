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
exports.parseFile = parseFile;
const fs = __importStar(require("fs"));
const ts = __importStar(require("typescript"));
function parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    const fileInfo = {
        imports: [],
        exports: [],
        functions: [],
        classes: []
    };
    function visit(node) {
        if (ts.isImportDeclaration(node)) {
            fileInfo.imports.push(node.moduleSpecifier.getText().replace(/['"]/g, ''));
        }
        else if (ts.isExportDeclaration(node)) {
            if (node.moduleSpecifier) {
                fileInfo.exports.push(node.moduleSpecifier.getText().replace(/['"]/g, ''));
            }
        }
        else if (ts.isFunctionDeclaration(node) && node.name) {
            fileInfo.functions.push(node.name.getText());
        }
        else if (ts.isClassDeclaration(node) && node.name) {
            fileInfo.classes.push(node.name.getText());
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return fileInfo;
}
//# sourceMappingURL=fileParser.js.map