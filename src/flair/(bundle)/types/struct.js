/**
 * @name Struct
 * @description Constructs a Struct type
 * @example
 *  Struct(name, factory)
 *  Struct(name, implementations, factory)
 * @params
 *  name: string - name of the struct
 *                 >> simple, e.g.,
 *                    MyStruct
 *                 >> auto naming, e.g., 
 *                    '(auto)'
 *                    Use this only when putting only one struct in a file and using flair.cli builder to build assembly
 *                    And in that case, filename will be used as struct name. So if file name is 'MyStruct.js', name would be 'MyStruct' (case sensitive)
 *                    To give namespace to a type, use $$('ns', 'com.product.feature');
 *                    Apply this attribute on struct definition itself. then struct can be accessed as getType('com.product.feature.MyStruct');
 *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
 *                    $$('ns', '(auto)'); In this case if MyStruct was put in a folder hierarchy as com/product/feature, it will
 *                    be given namespace com.product.feature
 *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
 *                    use $$('ns', '(auto)');
 *                    Then struct can be accessed as getType('MyStruct');
 *  mixints: array - An array of mixin and/or interface types which needs to be applied to this struct type
 *                        mixins will be applied in order they are defined here
 *  factory: function - factory function to build struct definition
 * @returns type - constructed flair struct type
 */
const _Struct = (name, mixints, factory) => {
    let args = _Args('name: string, factory: cfunction', 
                     'name: string, mixints: array, factory: cfunction')(name, mixints, factory);
    if (args.isInvalid) { throw args.error; }

    // builder config
    let cfg = {
        new: true,
        mixins: true,
        interfaces: true,
        func: true,
        construct: true,
        prop: true,
        propGetterSetter: true,
        types: {
            instance: 'sinstance',
            type: 'struct'
        },
        params: {
            typeName: args.values.name,
            mixinsAndInterfaces: args.values.mixints,
            factory: args.values.factory
        }
    };

    // return built type
    return builder(cfg);
};

// attach to flair
a2f('Struct', _Struct);
