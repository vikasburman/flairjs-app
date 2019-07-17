const Handler = await include('flair.app.Handler');

/**
 * @name ViewHandler
 * @description GUI View Handler
 */
$$('ns', '(auto)');
Class('(auto)', Handler, function() {
    let mainEl = '';

    $$('override');
    this.construct = (base, el, title, transition) => {
        base();

        // read from setting which are not specified
        el = el || settings.view.el || 'main';
        title = title || settings.view.title || '';
        transition = transition || settings.view.transition || '';

        mainEl = el;
        this.viewTransition = transition;
        this.title = this.title + (title ? ' - ' + title : '');
    };

    $$('privateSet');
    this.viewTransition = '';

    $$('protectedSet');
    this.name = '';

    $$('protectedSet');
    this.title = '';

    // each meta in array can be defined as:
    // { "<nameOfAttribute>": "<contentOfAttribute>", "<nameOfAttribute>": "<contentOfAttribute>", ... }
    $$('protectedSet');
    this.meta = null;

    this.view = async (ctx) => {
        const { ViewTransition } = ns('flair.ui');

        // give it a unique name, if not already given
        this.name = this.name || this.$Type.getName(true); // $Type is the main view which is finally inheriting this ViewHandler

        // load view transition
        if (this.viewTransition) {
            let ViewTransitionType = as(await include(this.viewTransition), ViewTransition);
            if (ViewTransitionType) {
                this.viewTransition = new ViewTransitionType();
            } else {
                this.viewTransition = '';
            }
        }

        // add view el to parent
        let el = DOC.createElement('div'),
            parentEl = DOC.getElementById(mainEl);
        el.id = this.name;
        el.setAttribute('hidden', '');
        parentEl.appendChild(el);
        
        // view
        await this.onView(ctx, el);

        // swap views (old one is replaced with this new one)
        await this.swap();
    };

    $$('protected');
    $$('virtual');
    $$('async');
    this.onView = noop;

    $$('private');
    this.swap = async () => {
        let thisViewEl = DOC.getElementById(this.name);

        // outgoing view
        if (this.$Type.currentView) {
            let currentViewEl = DOC.getElementById(this.$Type.currentView);

            // remove outgoing view meta   
            if (this.$Type.currentViewMeta) {
                for(let meta of this.$Type.currentViewMeta) {
                    DOC.head.removeChild(DOC.querySelector('meta[name="' + meta + '"]'));
                }
            }
                
            // apply transitions
            if (this.viewTransition) {
                // leave outgoing, enter incoming
                await this.viewTransition.leave(currentViewEl, thisViewEl);
                await this.viewTransition.enter(thisViewEl, currentViewEl);
            } else {
                // default is no transition
                if (currentViewEl) { currentViewEl.hidden = true; }
                thisViewEl.hidden = false;
            }

            // remove outgoing view
            let parentEl = DOC.getElementById(mainEl);  
            if (currentViewEl) { parentEl.removeChild(currentViewEl); }
        }

        // add incoming view meta
        if (this.meta) {
            for(let meta of this.meta) {
                var metaEl = document.createElement('meta');
                for(let metaAttr in meta) {
                    metaEl[metaAttr] = meta[metaAttr];
                }
                DOC.head.appendChild(metaEl);
            }
        }

        // in case there was no previous view
        if (!this.$Type.currentView) {
            thisViewEl.hidden = false;
        }

        // update title
        DOC.title = this.title;

        // set new current
        this.$static.currentView = this.name;
        this.$static.currentViewMeta = this.meta;
    };

    $$('static');
    this.currentView = null;

    $$('static');
    this.currentViewMeta = null;
});
