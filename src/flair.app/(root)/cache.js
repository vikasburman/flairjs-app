import { throws } from "assert";

const { Attribute } = ns();

/**
 * @name Cache
 * @description Caching custom attribute
 * $$('cache', { 'duration': 10000 }) OR $$('cache', 10000)
 */
$$('ns', '(auto)');
Class('(auto)', Attribute, function() {
    $$('override');
    this.construct = (base, cacheConfig) => {
        base(cacheConfig);

        // set cache config
        this.cacheConfig = (typeof cacheConfig === 'number' ? { duration: cacheConfig } : cacheConfig)
        this.enabled = (this.cacheConfig && this.cacheConfig.duration);

        // can be applied
        this.constraints = '(class || struct) && (func && async) && !(timer || on || @fetch || @cache)';
    };

    $$('readOnly');
    this.cacheConfig = null;

    $$('private');
    this.cacheHandler = Port('cacheHandler');

    $$('override');
    this.decorateFunction = (base, typeName, memberName, member) => { // eslint-disable-line no-unused-vars
        let _this = this,
            cacheId = `${typeName}___${memberName}`;

        let callMember = async (...args) => {
            let resultData = await member(...args);
            if (_this.isEnabled) { // save for later
                await _this.cacheHandler.set(cacheId, _this.cacheConfig, resultData);
            }
            return resultData;
        };

        // decorated function
        return async function(...args) {
            if (_this.isEnabled) {
                try {
                    return await _this.cacheHandler.get(cacheId, _this.cacheConfig);
                } catch (err) { // eslint-disable-line no-unused-vars
                    // ignore and move forward by calling callMember below
                }
            }
            return await callMember(...args);
        };
    };
});
