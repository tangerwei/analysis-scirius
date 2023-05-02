// current workspace

interface IWorkDir{
    dict: {
        [key: string]: string
    },
    finalJson: {
        [key: string]: {
            [key: string]: string
        }
    },
    filePath: string
}

export const workDir:IWorkDir = {
    dict: {
    },
    finalJson: {

    },
    filePath: ""
}

export const addDict = (key: string) => {
    if(!workDir.dict.hasOwnProperty(key)){
        workDir.dict[key] = ""
    }
}

export const resetDict = () => {
    workDir.dict = {}
}

export const removeNotMeaningful = (dict: any) => {
    const pattern = /[a-zA-Z]/;
    const newDict:any = {}
    for(let key in dict){
        if(pattern.test(key)){
            newDict[key] = dict[key]
        }
    }
    return newDict
}

export const autoSaveDict = (filePath: string) => {
    if(Object.keys(workDir.dict).length > 0){
        const newDict = removeNotMeaningful(workDir.dict);
        if(Object.keys(newDict).length > 0){
            workDir.finalJson[filePath] = newDict;
        }
        // reset locale
        resetDict();
    }
}
