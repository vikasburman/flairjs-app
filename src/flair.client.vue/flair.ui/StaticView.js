const { VueView } = await ns('flair.ui');

/**
 * @name StaticView
 * @description Static View
 */
$$('ns', '(auto)');
Class('(auto)', VueView, function() {
    $$('override');
    this.construct = (base, staticFile) => {
        base(staticFile);

        // if identified as static by base class
        if (this.isStatic) { 
            // set layout
            this.layout = settings.layout.static || null;

            // set paths
            this.basePath = this.staticRoot;
            this.localePath = this.basePath + 'locales/';

            // static file can be localized as well, hence its name can be:
            // ./path/file.xml : Will be resolved with ./path/file.xml
            // OR 
            // ./path/file{.en}.xml <-- yes: {.en} is a placeholder for chosen locale: Will be resolved with ./path/file.<locale>.xml
            if (this.staticFile.indexOf('{.en}') !== -1) {
                this.staticFile = this.staticFile.replace('{.en}', '.' + this.locale()); // whatever locale is currently selected
            }
        }
    };

    $$('protected');
    $$('override');
    this.loadStaticFile = async (base, ctx) => {
        base(ctx);

        // read static file and load all required elements here
        // static file is supposed to be an XML file having following format
        // <static title="" layout="" i18n="">
        //  <data><![CDATA[ ... ]]></data>
        //  <html type="md"><![CDATA[ ... ]]></html>
        //  <style><![CDATA[ ... ]]></style>
        // </static>
        //  
        // Root note must be called: static
        //  root node can have optional attributes:
        //      title - this is loaded on this.title
        //      layout - this is loaded on this.layout
        //      i18n - this is loaded on this.i18n
        // data node is optional and can have a JSON structure wrapped in a CDATA section
        //  this will be loaded as static data in this.data
        // html node is mandatory and can have following wrapped in a CDATA section
        //  the html to be loaded
        //  OR
        //  the markdown to be loaded after converting to html
        //      when markdown is given, type attribute with 'md' must be added
        // style node is optional and can have style definitions wrapped in a CDATA section
        let clientFileLoader = Port('clientFile'),
            staticFileContent = '',
            xmlDoc = null,
            tag_static = null,
            tag_html = null,
            tag_html_attr_type = null,
            html_content = '',
            tag_style = null,
            tag_data = null,
            dp = new DOMParser();

        // load file
        staticFileContent = await clientFileLoader(this.staticFile);
        xmlDoc = dp.parseFromString(staticFileContent, 'text/xml');

        // read structure
        tag_static = xmlDoc.getElementsByTagName('static')[0];
        tag_html = tag_static.getElementsByTagName('html')[0];
        tag_style = tag_static.getElementsByTagName('style')[0];
        tag_data = tag_static.getElementsByTagName('data')[0];

        // settings
        this.title = tag_static.getAttribute('title') || '';
        this.layout = tag_static.getAttribute('layout') || settings.static.layout || null;
        this.i18n = tag_static.getAttribute('i18n') || settings.static.i18n || null;
        
        // style
        this.style = tag_style ? tag_style.firstChild.data.trim() : null;
        
        // data
        this.data = tag_data ? JSON.parse(tag_data.firstChild.data.trim()) : null;

        // html
        tag_html_attr_type = (tag_html ? tag_html.getAttribute('type') || '' : '');
        html_content = (tag_html ? tag_html.firstChild.data.trim() : '');
        if (tag_html_attr_type === 'md') {
            const showdown = await include('showdown/showdown{.min}.js');
            let converter = new showdown.Converter(settings.showdown);
            this.html = converter.makeHtml(html_content);
        } else {
            this.html = html_content;
        }
    };
});
