import * as fs from 'fs';
import * as ts from 'typescript';

export function parseFile(filePath: string): any {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    const fileInfo: any = {
        imports: [],
        exports: [],
        functions: [],
        classes: []
    };

    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
            fileInfo.imports.push(node.moduleSpecifier.getText().replace(/['"]/g, ''));
        } else if (ts.isExportDeclaration(node)) {
            if (node.moduleSpecifier) {
                fileInfo.exports.push(node.moduleSpecifier.getText().replace(/['"]/g, ''));
            }
        } else if (ts.isFunctionDeclaration(node) && node.name) {
            fileInfo.functions.push(node.name.getText());
        } else if (ts.isClassDeclaration(node) && node.name) {
            fileInfo.classes.push(node.name.getText());
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return fileInfo;
}