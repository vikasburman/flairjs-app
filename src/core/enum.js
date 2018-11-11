// Enum
// Enum(enumName, {key: value})
oojs.Enum = (enumName, keyValuePairs) => {
    let _enum = keyValuePairs;
    _enum._ = {
        name: enumName,
        type: 'enum',
        keys: () => {
            let items = [];
            for(let key in keyValuePairs) {
                if (keyValuePairs.hasOwnProperty(key) && key !== '_') {
                    items.push(key);
                }
            }
            return items;
        },
        values: () => {
            let items = [];
            for(let key in keyValuePairs) {
                if (keyValuePairs.hasOwnProperty(key) && key !== '_') {
                    items.push(keyValuePairs[key]);
                }
            }
            return items;
        }
    };

    // return
    return Object.freeze(_enum);
};
oojs.Enum.getKeys = (enumObj) => {
    if (enumObj._ && enumObj._.type === 'enum') {
        return enumObj._.keys();
    }
    enumName = ((enumObj._ && enumObj._.name) ? enumObj._.name : 'unknown');
    throw `${enumName} is not an Enum.`;
};
oojs.Enum.getValues = (enumObj) => {
    if (enumObj._ && enumObj._.type === 'enum') {
        return enumObj._.values();
    }
    enumName = ((enumObj._ && enumObj._.name) ? enumObj._.name : 'unknown');
    throw `${enumName} is not an Enum.`;
};
oojs.Enum.isDefined = (enumObj, keyOrValue) => {
    if (enumObj._ && enumObj._.type === 'enum') {
        return (enumObj._.keys.indexOf(keyOrValue) !== -1 || enumObj._.values.indexOf(keyOrValue) !== -1) ? true : false;
    }
    enumName = ((enumObj._ && enumObj._.name) ? enumObj._.name : 'unknown');
    throw `${enumName} is not an Enum.`;
};
