'use strict';

var fs = require('fs');
var path = require('path');
var events = require('events');

const pathFile = path.join(__dirname, 'path.txt');

function getElectronPath () {
  let executablePath;
  if (fs.existsSync(pathFile)) {
    executablePath = fs.readFileSync(pathFile, 'utf-8');
  }
  if (process.env.ELECTRON_OVERRIDE_DIST_PATH) {
    return path.join(process.env.ELECTRON_OVERRIDE_DIST_PATH, executablePath || 'electron');
  }
  if (executablePath) {
    return path.join(__dirname, 'dist', executablePath);
  } else {
    throw new Error('Electron failed to install correctly, please delete node_modules/electron and try installing again');
  }
}



var electron = getElectronPath();

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var objectsRegistry = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
const getOwnerKey = (webContents, contextId) => {
    return `${webContents.id}-${contextId}`;
};
class ObjectsRegistry {
    constructor() {
        this.nextId = 0;
        // Stores all objects by ref-counting.
        // (id) => {object, count}
        this.storage = {};
        // Stores the IDs + refCounts of objects referenced by WebContents.
        // (ownerKey) => { id: refCount }
        this.owners = {};
        this.electronIds = new WeakMap();
    }
    // Register a new object and return its assigned ID. If the object is already
    // registered then the already assigned ID would be returned.
    add(webContents, contextId, obj) {
        // Get or assign an ID to the object.
        const id = this.saveToStorage(obj);
        // Add object to the set of referenced objects.
        const ownerKey = getOwnerKey(webContents, contextId);
        let owner = this.owners[ownerKey];
        if (!owner) {
            owner = this.owners[ownerKey] = new Map();
            this.registerDeleteListener(webContents, contextId);
        }
        if (!owner.has(id)) {
            owner.set(id, 0);
            // Increase reference count if not referenced before.
            this.storage[id].count++;
        }
        owner.set(id, owner.get(id) + 1);
        return id;
    }
    // Get an object according to its ID.
    get(id) {
        const pointer = this.storage[id];
        if (pointer != null)
            return pointer.object;
    }
    // Dereference an object according to its ID.
    // Note that an object may be double-freed (cleared when page is reloaded, and
    // then garbage collected in old page).
    remove(webContents, contextId, id) {
        const ownerKey = getOwnerKey(webContents, contextId);
        const owner = this.owners[ownerKey];
        if (owner && owner.has(id)) {
            const newRefCount = owner.get(id) - 1;
            // Only completely remove if the number of references GCed in the
            // renderer is the same as the number of references we sent them
            if (newRefCount <= 0) {
                // Remove the reference in owner.
                owner.delete(id);
                // Dereference from the storage.
                this.dereference(id);
            }
            else {
                owner.set(id, newRefCount);
            }
        }
    }
    // Clear all references to objects refrenced by the WebContents.
    clear(webContents, contextId) {
        const ownerKey = getOwnerKey(webContents, contextId);
        const owner = this.owners[ownerKey];
        if (!owner)
            return;
        for (const id of owner.keys())
            this.dereference(id);
        delete this.owners[ownerKey];
    }
    // Saves the object into storage and assigns an ID for it.
    saveToStorage(object) {
        let id = this.electronIds.get(object);
        if (!id) {
            id = ++this.nextId;
            this.storage[id] = {
                count: 0,
                object: object
            };
            this.electronIds.set(object, id);
        }
        return id;
    }
    // Dereference the object from store.
    dereference(id) {
        const pointer = this.storage[id];
        if (pointer == null) {
            return;
        }
        pointer.count -= 1;
        if (pointer.count === 0) {
            this.electronIds.delete(pointer.object);
            delete this.storage[id];
        }
    }
    // Clear the storage when renderer process is destroyed.
    registerDeleteListener(webContents, contextId) {
        // contextId => ${processHostId}-${contextCount}
        const processHostId = contextId.split('-')[0];
        const listener = (_, deletedProcessHostId) => {
            if (deletedProcessHostId &&
                deletedProcessHostId.toString() === processHostId) {
                webContents.removeListener('render-view-deleted', listener);
                this.clear(webContents, contextId);
            }
        };
        // Note that the "render-view-deleted" event may not be emitted on time when
        // the renderer process get destroyed because of navigation, we rely on the
        // renderer process to send "ELECTRON_BROWSER_CONTEXT_RELEASE" message to
        // guard this situation.
        webContents.on('render-view-deleted', listener);
    }
}
exports.default = new ObjectsRegistry();
});

unwrapExports(objectsRegistry);

var typeUtils = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserialize = exports.serialize = exports.isSerializableObject = exports.isPromise = void 0;

function isPromise(val) {
    return (val &&
        val.then &&
        val.then instanceof Function &&
        val.constructor &&
        val.constructor.reject &&
        val.constructor.reject instanceof Function &&
        val.constructor.resolve &&
        val.constructor.resolve instanceof Function);
}
exports.isPromise = isPromise;
const serializableTypes = [
    Boolean,
    Number,
    String,
    Date,
    Error,
    RegExp,
    ArrayBuffer
];
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#Supported_types
function isSerializableObject(value) {
    return value === null || ArrayBuffer.isView(value) || serializableTypes.some(type => value instanceof type);
}
exports.isSerializableObject = isSerializableObject;
const objectMap = function (source, mapper) {
    const sourceEntries = Object.entries(source);
    const targetEntries = sourceEntries.map(([key, val]) => [key, mapper(val)]);
    return Object.fromEntries(targetEntries);
};
function serializeNativeImage(image) {
    const representations = [];
    const scaleFactors = image.getScaleFactors();
    // Use Buffer when there's only one representation for better perf.
    // This avoids compressing to/from PNG where it's not necessary to
    // ensure uniqueness of dataURLs (since there's only one).
    if (scaleFactors.length === 1) {
        const scaleFactor = scaleFactors[0];
        const size = image.getSize(scaleFactor);
        const buffer = image.toBitmap({ scaleFactor });
        representations.push({ scaleFactor, size, buffer });
    }
    else {
        // Construct from dataURLs to ensure that they are not lost in creation.
        for (const scaleFactor of scaleFactors) {
            const size = image.getSize(scaleFactor);
            const dataURL = image.toDataURL({ scaleFactor });
            representations.push({ scaleFactor, size, dataURL });
        }
    }
    return { __ELECTRON_SERIALIZED_NativeImage__: true, representations };
}
function deserializeNativeImage(value) {
    const image = electron.nativeImage.createEmpty();
    // Use Buffer when there's only one representation for better perf.
    // This avoids compressing to/from PNG where it's not necessary to
    // ensure uniqueness of dataURLs (since there's only one).
    if (value.representations.length === 1) {
        const { buffer, size, scaleFactor } = value.representations[0];
        const { width, height } = size;
        image.addRepresentation({ buffer, scaleFactor, width, height });
    }
    else {
        // Construct from dataURLs to ensure that they are not lost in creation.
        for (const rep of value.representations) {
            const { dataURL, size, scaleFactor } = rep;
            const { width, height } = size;
            image.addRepresentation({ dataURL, scaleFactor, width, height });
        }
    }
    return image;
}
function serialize(value) {
    if (value && value.constructor && value.constructor.name === 'NativeImage') {
        return serializeNativeImage(value);
    }
    if (Array.isArray(value)) {
        return value.map(serialize);
    }
    else if (isSerializableObject(value)) {
        return value;
    }
    else if (value instanceof Object) {
        return objectMap(value, serialize);
    }
    else {
        return value;
    }
}
exports.serialize = serialize;
function deserialize(value) {
    if (value && value.__ELECTRON_SERIALIZED_NativeImage__) {
        return deserializeNativeImage(value);
    }
    else if (Array.isArray(value)) {
        return value.map(deserialize);
    }
    else if (isSerializableObject(value)) {
        return value;
    }
    else if (value instanceof Object) {
        return objectMap(value, deserialize);
    }
    else {
        return value;
    }
}
exports.deserialize = deserialize;
});

unwrapExports(typeUtils);
typeUtils.deserialize;
typeUtils.serialize;
typeUtils.isSerializableObject;
typeUtils.isPromise;

var getElectronBinding_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElectronBinding = void 0;
const getElectronBinding = (name) => {
    if (process._linkedBinding) {
        return process._linkedBinding('electron_common_' + name);
    }
    else if (process.electronBinding) {
        return process.electronBinding(name);
    }
    else {
        return null;
    }
};
exports.getElectronBinding = getElectronBinding;
});

unwrapExports(getElectronBinding_1);
getElectronBinding_1.getElectronBinding;

var server = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = exports.enable = exports.isRemoteModuleEnabled = void 0;

const objects_registry_1 = __importDefault(objectsRegistry);



const { Promise } = commonjsGlobal;
const v8Util = getElectronBinding_1.getElectronBinding('v8_util');
const hasWebPrefsRemoteModuleAPI = (() => {
    var _a, _b;
    const electronVersion = Number((_b = (_a = process.versions.electron) === null || _a === void 0 ? void 0 : _a.split(".")) === null || _b === void 0 ? void 0 : _b[0]);
    return Number.isNaN(electronVersion) || electronVersion < 14;
})();
// The internal properties of Function.
const FUNCTION_PROPERTIES = [
    'length', 'name', 'arguments', 'caller', 'prototype'
];
// The remote functions in renderer processes.
const rendererFunctionCache = new Map();
// eslint-disable-next-line no-undef
const finalizationRegistry = new FinalizationRegistry((fi) => {
    const mapKey = fi.id[0] + '~' + fi.id[1];
    const ref = rendererFunctionCache.get(mapKey);
    if (ref !== undefined && ref.deref() === undefined) {
        rendererFunctionCache.delete(mapKey);
        if (!fi.webContents.isDestroyed()) {
            try {
                fi.webContents.sendToFrame(fi.frameId, "REMOTE_RENDERER_RELEASE_CALLBACK" /* RENDERER_RELEASE_CALLBACK */, fi.id[0], fi.id[1]);
            }
            catch (error) {
                console.warn(`sendToFrame() failed: ${error}`);
            }
        }
    }
});
function getCachedRendererFunction(id) {
    const mapKey = id[0] + '~' + id[1];
    const ref = rendererFunctionCache.get(mapKey);
    if (ref !== undefined) {
        const deref = ref.deref();
        if (deref !== undefined)
            return deref;
    }
}
function setCachedRendererFunction(id, wc, frameId, value) {
    // eslint-disable-next-line no-undef
    const wr = new WeakRef(value);
    const mapKey = id[0] + '~' + id[1];
    rendererFunctionCache.set(mapKey, wr);
    finalizationRegistry.register(value, {
        id,
        webContents: wc,
        frameId
    });
    return value;
}
const locationInfo = new WeakMap();
// Return the description of object's members:
const getObjectMembers = function (object) {
    let names = Object.getOwnPropertyNames(object);
    // For Function, we should not override following properties even though they
    // are "own" properties.
    if (typeof object === 'function') {
        names = names.filter((name) => {
            return !FUNCTION_PROPERTIES.includes(name);
        });
    }
    // Map properties to descriptors.
    return names.map((name) => {
        const descriptor = Object.getOwnPropertyDescriptor(object, name);
        let type;
        let writable = false;
        if (descriptor.get === undefined && typeof object[name] === 'function') {
            type = 'method';
        }
        else {
            if (descriptor.set || descriptor.writable)
                writable = true;
            type = 'get';
        }
        return { name, enumerable: descriptor.enumerable, writable, type };
    });
};
// Return the description of object's prototype.
const getObjectPrototype = function (object) {
    const proto = Object.getPrototypeOf(object);
    if (proto === null || proto === Object.prototype)
        return null;
    return {
        members: getObjectMembers(proto),
        proto: getObjectPrototype(proto)
    };
};
// Convert a real value into meta data.
const valueToMeta = function (sender, contextId, value, optimizeSimpleObject = false) {
    // Determine the type of value.
    let type;
    switch (typeof value) {
        case 'object':
            // Recognize certain types of objects.
            if (value instanceof Buffer) {
                type = 'buffer';
            }
            else if (value && value.constructor && value.constructor.name === 'NativeImage') {
                type = 'nativeimage';
            }
            else if (Array.isArray(value)) {
                type = 'array';
            }
            else if (value instanceof Error) {
                type = 'error';
            }
            else if (typeUtils.isSerializableObject(value)) {
                type = 'value';
            }
            else if (typeUtils.isPromise(value)) {
                type = 'promise';
            }
            else if (Object.prototype.hasOwnProperty.call(value, 'callee') && value.length != null) {
                // Treat the arguments object as array.
                type = 'array';
            }
            else if (optimizeSimpleObject && v8Util.getHiddenValue(value, 'simple')) {
                // Treat simple objects as value.
                type = 'value';
            }
            else {
                type = 'object';
            }
            break;
        case 'function':
            type = 'function';
            break;
        default:
            type = 'value';
            break;
    }
    // Fill the meta object according to value's type.
    if (type === 'array') {
        return {
            type,
            members: value.map((el) => valueToMeta(sender, contextId, el, optimizeSimpleObject))
        };
    }
    else if (type === 'nativeimage') {
        return { type, value: typeUtils.serialize(value) };
    }
    else if (type === 'object' || type === 'function') {
        return {
            type,
            name: value.constructor ? value.constructor.name : '',
            // Reference the original value if it's an object, because when it's
            // passed to renderer we would assume the renderer keeps a reference of
            // it.
            id: objects_registry_1.default.add(sender, contextId, value),
            members: getObjectMembers(value),
            proto: getObjectPrototype(value)
        };
    }
    else if (type === 'buffer') {
        return { type, value };
    }
    else if (type === 'promise') {
        // Add default handler to prevent unhandled rejections in main process
        // Instead they should appear in the renderer process
        value.then(function () { }, function () { });
        return {
            type,
            then: valueToMeta(sender, contextId, function (onFulfilled, onRejected) {
                value.then(onFulfilled, onRejected);
            })
        };
    }
    else if (type === 'error') {
        return {
            type,
            value,
            members: Object.keys(value).map(name => ({
                name,
                value: valueToMeta(sender, contextId, value[name])
            }))
        };
    }
    else {
        return {
            type: 'value',
            value
        };
    }
};
const throwRPCError = function (message) {
    const error = new Error(message);
    error.code = 'EBADRPC';
    error.errno = -72;
    throw error;
};
const removeRemoteListenersAndLogWarning = (sender, callIntoRenderer) => {
    const location = locationInfo.get(callIntoRenderer);
    let message = 'Attempting to call a function in a renderer window that has been closed or released.' +
        `\nFunction provided here: ${location}`;
    if (sender instanceof events.EventEmitter) {
        const remoteEvents = sender.eventNames().filter((eventName) => {
            return sender.listeners(eventName).includes(callIntoRenderer);
        });
        if (remoteEvents.length > 0) {
            message += `\nRemote event names: ${remoteEvents.join(', ')}`;
            remoteEvents.forEach((eventName) => {
                sender.removeListener(eventName, callIntoRenderer);
            });
        }
    }
    console.warn(message);
};
const fakeConstructor = (constructor, name) => new Proxy(Object, {
    get(target, prop, receiver) {
        if (prop === 'name') {
            return name;
        }
        else {
            return Reflect.get(target, prop, receiver);
        }
    }
});
// Convert array of meta data from renderer into array of real values.
const unwrapArgs = function (sender, frameId, contextId, args) {
    const metaToValue = function (meta) {
        switch (meta.type) {
            case 'nativeimage':
                return typeUtils.deserialize(meta.value);
            case 'value':
                return meta.value;
            case 'remote-object':
                return objects_registry_1.default.get(meta.id);
            case 'array':
                return unwrapArgs(sender, frameId, contextId, meta.value);
            case 'buffer':
                return Buffer.from(meta.value.buffer, meta.value.byteOffset, meta.value.byteLength);
            case 'promise':
                return Promise.resolve({
                    then: metaToValue(meta.then)
                });
            case 'object': {
                const ret = meta.name !== 'Object' ? Object.create({
                    constructor: fakeConstructor(Object, meta.name)
                }) : {};
                for (const { name, value } of meta.members) {
                    ret[name] = metaToValue(value);
                }
                return ret;
            }
            case 'function-with-return-value': {
                const returnValue = metaToValue(meta.value);
                return function () {
                    return returnValue;
                };
            }
            case 'function': {
                // Merge contextId and meta.id, since meta.id can be the same in
                // different webContents.
                const objectId = [contextId, meta.id];
                // Cache the callbacks in renderer.
                const cachedFunction = getCachedRendererFunction(objectId);
                if (cachedFunction !== undefined) {
                    return cachedFunction;
                }
                const callIntoRenderer = function (...args) {
                    let succeed = false;
                    if (!sender.isDestroyed()) {
                        try {
                            succeed = sender.sendToFrame(frameId, "REMOTE_RENDERER_CALLBACK" /* RENDERER_CALLBACK */, contextId, meta.id, valueToMeta(sender, contextId, args)) !== false;
                        }
                        catch (error) {
                            console.warn(`sendToFrame() failed: ${error}`);
                        }
                    }
                    if (!succeed) {
                        removeRemoteListenersAndLogWarning(this, callIntoRenderer);
                    }
                };
                locationInfo.set(callIntoRenderer, meta.location);
                Object.defineProperty(callIntoRenderer, 'length', { value: meta.length });
                setCachedRendererFunction(objectId, sender, frameId, callIntoRenderer);
                return callIntoRenderer;
            }
            default:
                throw new TypeError(`Unknown type: ${meta.type}`);
        }
    };
    return args.map(metaToValue);
};
const isRemoteModuleEnabledImpl = function (contents) {
    const webPreferences = contents.getLastWebPreferences() || {};
    return webPreferences.enableRemoteModule != null ? !!webPreferences.enableRemoteModule : false;
};
const isRemoteModuleEnabledCache = new WeakMap();
const isRemoteModuleEnabled = function (contents) {
    if (hasWebPrefsRemoteModuleAPI && !isRemoteModuleEnabledCache.has(contents)) {
        isRemoteModuleEnabledCache.set(contents, isRemoteModuleEnabledImpl(contents));
    }
    return isRemoteModuleEnabledCache.get(contents);
};
exports.isRemoteModuleEnabled = isRemoteModuleEnabled;
function enable(contents) {
    isRemoteModuleEnabledCache.set(contents, true);
}
exports.enable = enable;
const handleRemoteCommand = function (channel, handler) {
    electron.ipcMain.on(channel, (event, contextId, ...args) => {
        let returnValue;
        if (!exports.isRemoteModuleEnabled(event.sender)) {
            event.returnValue = {
                type: 'exception',
                value: valueToMeta(event.sender, contextId, new Error('@electron/remote is disabled for this WebContents. Call require("@electron/remote/main").enable(webContents) to enable it.'))
            };
            return;
        }
        try {
            returnValue = handler(event, contextId, ...args);
        }
        catch (error) {
            returnValue = {
                type: 'exception',
                value: valueToMeta(event.sender, contextId, error),
            };
        }
        if (returnValue !== undefined) {
            event.returnValue = returnValue;
        }
    });
};
const emitCustomEvent = function (contents, eventName, ...args) {
    const event = { sender: contents, returnValue: undefined, defaultPrevented: false };
    electron.app.emit(eventName, event, contents, ...args);
    contents.emit(eventName, event, ...args);
    return event;
};
const logStack = function (contents, code, stack) {
    if (stack) {
        console.warn(`WebContents (${contents.id}): ${code}`, stack);
    }
};
let initialized = false;
function initialize() {
    if (initialized)
        throw new Error('@electron/remote has already been initialized');
    initialized = true;
    handleRemoteCommand("REMOTE_BROWSER_WRONG_CONTEXT_ERROR" /* BROWSER_WRONG_CONTEXT_ERROR */, function (event, contextId, passedContextId, id) {
        const objectId = [passedContextId, id];
        const cachedFunction = getCachedRendererFunction(objectId);
        if (cachedFunction === undefined) {
            // Do nothing if the error has already been reported before.
            return;
        }
        removeRemoteListenersAndLogWarning(event.sender, cachedFunction);
    });
    handleRemoteCommand("REMOTE_BROWSER_REQUIRE" /* BROWSER_REQUIRE */, function (event, contextId, moduleName, stack) {
        logStack(event.sender, `remote.require('${moduleName}')`, stack);
        const customEvent = emitCustomEvent(event.sender, 'remote-require', moduleName);
        if (customEvent.returnValue === undefined) {
            if (customEvent.defaultPrevented) {
                throw new Error(`Blocked remote.require('${moduleName}')`);
            }
            else {
                customEvent.returnValue = process.mainModule.require(moduleName);
            }
        }
        return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_GET_BUILTIN" /* BROWSER_GET_BUILTIN */, function (event, contextId, moduleName, stack) {
        logStack(event.sender, `remote.getBuiltin('${moduleName}')`, stack);
        const customEvent = emitCustomEvent(event.sender, 'remote-get-builtin', moduleName);
        if (customEvent.returnValue === undefined) {
            if (customEvent.defaultPrevented) {
                throw new Error(`Blocked remote.getBuiltin('${moduleName}')`);
            }
            else {
                customEvent.returnValue = electron[moduleName];
            }
        }
        return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_GET_GLOBAL" /* BROWSER_GET_GLOBAL */, function (event, contextId, globalName, stack) {
        logStack(event.sender, `remote.getGlobal('${globalName}')`, stack);
        const customEvent = emitCustomEvent(event.sender, 'remote-get-global', globalName);
        if (customEvent.returnValue === undefined) {
            if (customEvent.defaultPrevented) {
                throw new Error(`Blocked remote.getGlobal('${globalName}')`);
            }
            else {
                customEvent.returnValue = commonjsGlobal[globalName];
            }
        }
        return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_GET_CURRENT_WINDOW" /* BROWSER_GET_CURRENT_WINDOW */, function (event, contextId, stack) {
        logStack(event.sender, 'remote.getCurrentWindow()', stack);
        const customEvent = emitCustomEvent(event.sender, 'remote-get-current-window');
        if (customEvent.returnValue === undefined) {
            if (customEvent.defaultPrevented) {
                throw new Error('Blocked remote.getCurrentWindow()');
            }
            else {
                customEvent.returnValue = event.sender.getOwnerBrowserWindow();
            }
        }
        return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_GET_CURRENT_WEB_CONTENTS" /* BROWSER_GET_CURRENT_WEB_CONTENTS */, function (event, contextId, stack) {
        logStack(event.sender, 'remote.getCurrentWebContents()', stack);
        const customEvent = emitCustomEvent(event.sender, 'remote-get-current-web-contents');
        if (customEvent.returnValue === undefined) {
            if (customEvent.defaultPrevented) {
                throw new Error('Blocked remote.getCurrentWebContents()');
            }
            else {
                customEvent.returnValue = event.sender;
            }
        }
        return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_CONSTRUCTOR" /* BROWSER_CONSTRUCTOR */, function (event, contextId, id, args) {
        args = unwrapArgs(event.sender, event.frameId, contextId, args);
        const constructor = objects_registry_1.default.get(id);
        if (constructor == null) {
            throwRPCError(`Cannot call constructor on missing remote object ${id}`);
        }
        return valueToMeta(event.sender, contextId, new constructor(...args));
    });
    handleRemoteCommand("REMOTE_BROWSER_FUNCTION_CALL" /* BROWSER_FUNCTION_CALL */, function (event, contextId, id, args) {
        args = unwrapArgs(event.sender, event.frameId, contextId, args);
        const func = objects_registry_1.default.get(id);
        if (func == null) {
            throwRPCError(`Cannot call function on missing remote object ${id}`);
        }
        try {
            return valueToMeta(event.sender, contextId, func(...args), true);
        }
        catch (error) {
            const err = new Error(`Could not call remote function '${func.name || "anonymous"}'. Check that the function signature is correct. Underlying error: ${error}\n` +
                (error instanceof Error ? `Underlying stack: ${error.stack}\n` : ""));
            err.cause = error;
            throw err;
        }
    });
    handleRemoteCommand("REMOTE_BROWSER_MEMBER_CONSTRUCTOR" /* BROWSER_MEMBER_CONSTRUCTOR */, function (event, contextId, id, method, args) {
        args = unwrapArgs(event.sender, event.frameId, contextId, args);
        const object = objects_registry_1.default.get(id);
        if (object == null) {
            throwRPCError(`Cannot call constructor '${method}' on missing remote object ${id}`);
        }
        return valueToMeta(event.sender, contextId, new object[method](...args));
    });
    handleRemoteCommand("REMOTE_BROWSER_MEMBER_CALL" /* BROWSER_MEMBER_CALL */, function (event, contextId, id, method, args) {
        args = unwrapArgs(event.sender, event.frameId, contextId, args);
        const object = objects_registry_1.default.get(id);
        if (object == null) {
            throwRPCError(`Cannot call method '${method}' on missing remote object ${id}`);
        }
        try {
            return valueToMeta(event.sender, contextId, object[method](...args), true);
        }
        catch (error) {
            const err = new Error(`Could not call remote method '${method}'. Check that the method signature is correct. Underlying error: ${error}` +
                (error instanceof Error ? `Underlying stack: ${error.stack}\n` : ""));
            err.cause = error;
            throw err;
        }
    });
    handleRemoteCommand("REMOTE_BROWSER_MEMBER_SET" /* BROWSER_MEMBER_SET */, function (event, contextId, id, name, args) {
        args = unwrapArgs(event.sender, event.frameId, contextId, args);
        const obj = objects_registry_1.default.get(id);
        if (obj == null) {
            throwRPCError(`Cannot set property '${name}' on missing remote object ${id}`);
        }
        obj[name] = args[0];
        return null;
    });
    handleRemoteCommand("REMOTE_BROWSER_MEMBER_GET" /* BROWSER_MEMBER_GET */, function (event, contextId, id, name) {
        const obj = objects_registry_1.default.get(id);
        if (obj == null) {
            throwRPCError(`Cannot get property '${name}' on missing remote object ${id}`);
        }
        return valueToMeta(event.sender, contextId, obj[name]);
    });
    handleRemoteCommand("REMOTE_BROWSER_DEREFERENCE" /* BROWSER_DEREFERENCE */, function (event, contextId, id) {
        objects_registry_1.default.remove(event.sender, contextId, id);
    });
    handleRemoteCommand("REMOTE_BROWSER_CONTEXT_RELEASE" /* BROWSER_CONTEXT_RELEASE */, (event, contextId) => {
        objects_registry_1.default.clear(event.sender, contextId);
        return null;
    });
}
exports.initialize = initialize;
});

unwrapExports(server);
server.initialize;
server.enable;
server.isRemoteModuleEnabled;

var main$1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.enable = exports.initialize = void 0;

Object.defineProperty(exports, "initialize", { enumerable: true, get: function () { return server.initialize; } });
Object.defineProperty(exports, "enable", { enumerable: true, get: function () { return server.enable; } });
});

unwrapExports(main$1);
main$1.enable;
main$1.initialize;

var main = main$1;

const {app, BrowserWindow, dialog} = electron;
main.initialize();

// Create the browser window
function createWindow(){
let win= new BrowserWindow({
width: 500,
height: 800,
resizable: false,
icon: __dirname + "/A_ICON.png",
webPreferences: {
nodeIntegration: true,
      contextIsolation: false,
}
});

main.enable(win.webContents);

// load the html file into the window
//win.loadFile('index.html')
win.loadFile('index.html');
win.setMenu(null); 

//show the DevTools
win.webContents.openDevTools();
}

//app.on is the function in charge of launching the windows
app.on('ready', createWindow);

var app_1 = {

};

module.exports = app_1;
