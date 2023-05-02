import {addDict, autoSaveDict, workDir} from "./dict";

const fs = require('fs');
const babelParser = require('@babel/parser');
const babelTraverse = require('@babel/traverse').default;

const observerProperties = [
    "title",
    "placeholder",
    "description",
    "label",
    "tooltip",
    "text",
]

const parseJSXToAST = (inputFile: string) => {
    try {
        const inputContent = fs.readFileSync(inputFile, 'utf-8');
        const ast = babelParser.parse(inputContent, {
            sourceType: 'module',
            plugins: ['jsx'],
        });

        return ast;
    } catch (error) {
        console.error(`Failed to parse JSX file "${inputFile}" to AST:`, error);
        return null;
    }
};


const observerLabelProperties = [
    "label",
    "span",
    "p",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6"
]

// 1.属性查找 2. 检测特定标签
function JSXOpeningElement(path: any){
    const node = path.node;
    if(node.type === 'JSXOpeningElement'){
        const attribute = node.attributes.find(
            (attr: any) => attr.type === 'JSXAttribute'
                && observerProperties.includes(attr.name.name)
        )
        // 属性检查成功
        if(attribute){
            if (attribute.value.type === 'StringLiteral') {
                addDict(attribute.value.value)
            } else if (attribute.value.type === 'JSXExpressionContainer') {
                // console.log('Title attribute value is an expression:', attribute.value.expression.toString());
            }
        }
    }
}

// 文本内容检测
function JSXText(path: any){
    if(path.node.type === 'JSXText'){
        const text = path.node.value.trim();
        if(text){
            addDict(text)
        }
    }
}

function JSObject(item: any){
    if(item.type === 'ObjectExpression'){
        const properties = item.properties;
        if(properties.length > 0){
            // 遍历对象
            for(let j=0; j < properties.length; j++){
                const property = properties[j];
                if(!property.key){
                    continue;
                }
                const propertyName = property.key.name || property.key.value;
                const propertyValue = property.value;
                if(observerProperties.includes(propertyName) && propertyValue){
                    if(propertyValue.type === 'StringLiteral'){
                        addDict(propertyValue.value)
                    }
                }
            }
        }
    }
}

function jsArray(nodeValue: any){
    if(nodeValue.elements.length > 0){
        // 遍历数组
        for(let i=0; i < nodeValue.elements.length; i++){
            const item = nodeValue.elements[i];
            // string []
            if(item.type === 'StringLiteral'){
                addDict(item.value)
            }
            // array<object>
            JSObject(item)
        }
    }
}

// 变量赋值检测
function AssignmentExpression(path: any){
    const node = path.node;
    const nodeValue = node.right;
    if(node.type === 'AssignmentExpression' && nodeValue){
        // array or object
        if(nodeValue.type === 'ArrayExpression'){
            jsArray(nodeValue)
        }else if(nodeValue.type === 'ObjectExpression') {
            JSObject(nodeValue)
        }
    }
}

// 变量定义检测
function VariableDeclarator(path: any){
    const node = path.node;
    const nodeValue = node.init;
    if(node.type === 'VariableDeclarator' && nodeValue){
        // array or object
        if(nodeValue.type === 'ArrayExpression'){
            jsArray(nodeValue)
        }else if(nodeValue.type === 'ObjectExpression') {
            JSObject(nodeValue)
        }
    }
}

const traverseAST = (ast: any) => {
    try {
        babelTraverse(ast, {
            JSXOpeningElement,
            JSXText,
            AssignmentExpression,
            VariableDeclarator
        });
    } catch (error) {
        console.error('Failed to traverse AST:', error);
    }
};

export const analysisJSFile = (filePath: string) => {
    const ast = parseJSXToAST(filePath);
    workDir.filePath = filePath;
    if (ast) {
        traverseAST(ast);
    }
    autoSaveDict(filePath)
}
