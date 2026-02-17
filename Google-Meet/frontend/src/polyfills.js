import EventEmitter from 'eventemitter3';

export { EventEmitter };

export const debuglog = () => () => { };
export const inspect = (obj) => {
    try {
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return String(obj);
    }
};
export const inherits = (ctor, superCtor) => {
    if (superCtor) {
        ctor.super_ = superCtor;
        Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
    }
};

const util = {
    debuglog,
    inspect,
    inherits,
    deprecate: (fn) => fn,
    _extend: (target, source) => Object.assign(target, source)
};

export default util;
