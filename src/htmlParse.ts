import {readFileSync} from "fs";
import {addDict, autoSaveDict} from "./dict";
import {load} from "cheerio";

// 匹配django的语法
const blockContentRegex = /\{%[^%]*%\}/g;

// 变量正则
const variableRegex = /{{[^}]*}}/g;

// 注释
const docRegex = /\{#.*?#\}/g;

function traverseNodes(node: any) {
    // script 暂时跳过
    if(node.name !== 'script' && node.name !== 'style'){
        if (node.type === 'text') {
            const text = node.data.trim();
            if (text.length > 0) {
                // django block content
                let textZ = text.replace(blockContentRegex, "");
                // django variable
                textZ = textZ.replace(variableRegex, "");
                // 去掉空格
                textZ = textZ.trim();
                if(textZ){
                    // 如果包含换行，则将内容拆分
                    if(textZ.includes("\n")){
                        const textList = textZ.split("\n");
                        textList.forEach((item: string) => {
                            // 注意注释
                            const _item = item.trim();
                            if(!docRegex.test(_item)){
                                addDict(_item)
                            }
                        })
                    }else{
                        if(!docRegex.test(textZ)){
                            addDict(textZ)
                        }
                    }
                }
            }
        }
        if (node.children) {
            node.children.forEach((child: any) => {
                traverseNodes(child);
            });
        }
    }
}

function parseHtml(fileText: string){
    const $ = load(fileText);
    traverseNodes($('body')[0]);
}

export function analysisHtml(filePath: string){
    const fileText = readFileSync(filePath, 'utf-8');
    parseHtml(fileText);
    autoSaveDict(filePath)
}
