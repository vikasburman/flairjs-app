/**
 * @name event
 * @description Event marker
 * @example
 *  event()
 * @params
 *  argsProcessor - args processor function, if args to be processed before event is raised
 * @returns
 *  function - returns given function or a noop function as is with an event marked tag
 */ 
const _event = (argsProcessor) => { 
    if (argsProcessor && typeof argsProcessor !== 'function') { throw _Exception.InvalidArgument('argsProcessor'); }
    argsProcessor = (typeof argsProcessor === 'function' ? argsProcessor : _noop);
    if (argsProcessor === _noop) {
        argsProcessor = () => {}; // note: because _noop/flair.noop is freezed, it does not allow add/delete 'event' flag.
    }
    argsProcessor.event = true; // attach tag
    return argsProcessor;
}

// attach to flair
a2f('event', _event);
