import {readdirSync, readFileSync, writeFileSync} from "fs"
import {join, sep} from "path"
import {parse, createVisitor} from "python-ast";
import {analysisJSFile} from "./jsxParse";
import {addDict, autoSaveDict, workDir} from "./dict";
import {analysisHtml} from "./htmlParse";

const textProperty = ["'title'", "'placeholder'", "'description'"].map(item => item.toLowerCase())

const listVisitor = createVisitor({
    visitDictorsetmaker: function (ctx){
        // 大括号
        for(let i = 0; i < ctx.childCount; i++){
            const child = ctx.getChild(i)
            if(child.text === ","){
                continue;
            }
            if(child.text === ":"){
                const property = ctx.getChild(i-1).text
                const value = ctx.getChild(i+1).text;
                if(textProperty.includes(property)){
                    addDict(value)
                }
            }
        }
    }
})

const fileVisitor = createVisitor({
    visitTestlist_comp: function (ctx){
        if(ctx.childCount > 5){
            for (let i = 0; i < ctx.childCount; i++){
                const child = ctx.getChild(i)
                // 去掉引号
                if(child.childCount > 0){
                    const text = child.text;
                    if(["(", "[", "{"].includes(text[0])){
                        listVisitor.visit(child)
                    }
                }
            }
        }
    }
})


const basePath = "/Users/duke_t/PycharmProjects/ids-ips"

const skipDir = [
    "node_modules",
    ".github",
    "account",
    "doc",
    "docker",
    "npm",
    "static",
    "scss",
    "ui",
    "config",
    "public",
    "scripts",
    "css",
    "fonts",
    "img"
]

function main(){
    const recur = (curDir: string) => {
        readdirSync(curDir, { withFileTypes: true }).forEach((value) => {
            process.stdout.clearLine(1)
            process.stdout.write(`\r${curDir}${sep}${value.name} \r`);
            // dir
            const filePath = join(curDir, value.name);
            if(value.isDirectory()){
                // skip dir
                if (skipDir.includes(value.name)) {
                    return;
                }
                recur(filePath)
                return;
            }
            if(value.isFile()){
                if(value.name.endsWith(".py")){
                    analysisFile(filePath)
                    return;
                }
                if(value.name.endsWith(".js") || value.name.endsWith(".jsx")){
                    analysisJSFile(filePath)
                    return;
                }
                if(value.name.endsWith(".html")){
                    analysisHtml(filePath)
                    return;
                }
            }
        });
    };
    recur(basePath)
    // write json to file
    const jsonFullPath = join(__dirname, `${Date.now()}.json`)
    writeFileSync(jsonFullPath, JSON.stringify(workDir.finalJson, null, 2));
}

function analysisFile(filePath: string){
    const fileText = readFileSync(filePath, 'utf-8');
    const ast = parse(fileText);
    fileVisitor.visit(ast);
    autoSaveDict(filePath)
}


main()
