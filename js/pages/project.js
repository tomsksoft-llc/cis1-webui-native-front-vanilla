/**
 * Project, job, file-system
 *
 * Methods:
 * actionsJob       - Methods that are used when clicking buttons of job
 * actionsEntry     - Methods that are used when clicking buttons of entry
 * formInputData    - Methods that are used to work with the data filling form
 * sendDataServer   - Methods that are used to move from one table to another
 *     @param {string} path - (Optional) Parameter containing url
 *                                   Line of the form 'project=[v1]&job=[v2]...'
 *
 * init            - Variable initialization
 *
 * onmessage       - Behavior on response from server
 *     @param {object} message - Text of response text of response from server
 *         @param {string} event - Success of action
 *                          Variant 'cis.project_list.get.success' (success get projects list) ||
 *                          'cis.project.info.success' (success get jobs list) ||
 *                          'cis.job.info.success' (success get builds list) ||
 *                          'fs.entry.list.success' (success get entry list) ||
 *                          'cis.property.info.success' (go to properties section) ||
 *                          'cis.job.run.success' (success job run) ||
 *                          'user.job.error.invalid_params' (invalid parameters specified at startup of job)
 *         @param {obj} data            - Message data
 *             @param {array} fs_entries - Array with record objects
 *                 @param {string} name    - Name of entry
 *                 @param {string} link    - URL to download
 *                 @param {bool} directory - Is this property or build
 *                 @param {obj} metainfo   - Record metadata
 *                     @param {string}date - (Optional) Start date
 *         @param {string} errorMessage - request errors
 */

var Project = {

    _url: {}
    , _elements: {
        project: null
        , buttons: null
        , path: null
        , info: null
        , table: null
        , title: null
        , header: null
    }
    , _events: {
        create_table: {
            project: 'cis.project_list.get'
            , job: 'cis.project.info'
            , build: 'cis.job.info'
            , entry: 'fs.entry.list'
        }
        , entry_refresh: 'fs.entry.refresh'
        , action_job: {
            job_run: 'cis.job.run'
        }
        , action_entry: {
                new_dir : 'fs.entry.new_dir'
                , remove: 'fs.entry.remove'
            }
    }
    , _templates: {}

    , init: function() {

        this._url = Hash.get();

        for (var key in this._elements) {
            this._elements[key] = (key == 'project') ? Selector.id('project') : Selector.id('project-' + key);
        }

        var selector_name = 'template-project-';
        Selector.queryAll('script[id^="' + selector_name + '"]')
            .forEach(function(item) {
                Project._templates[item.id
                    .replaceAll(selector_name,'')
                    .replaceAll('-','_')
                ] = item.innerHTML.trim();
            });

        this.sendDataServer();
    }

    , sendDataServer: function(path) {

        var self = this;

        if (typeof path == 'string') {
            this._url = {};
        }

        if (path) {
            path.split('&')
                .forEach(function(item) {
                    if ( ! item) {
                        return;
                    }
                    var parts = item.split('=');
                    if ( ! parts) {
                        return;
                    }
                    self._url[parts[0]] = parts[1];
                });
        }

        if (this._url.project &&
            this._url.job &&
            this._url.build) {

            this._sendRequest(this._events.create_table.entry, {path: this._serialize()});

        } else if (this._url.project &&
                    this._url.job &&
                    this._url.name) {

            this.onmessage({event: 'cis.property.info.success'});

        } else if (this._url.project &&
                    this._url.job) {

            this._sendRequest(this._events.create_table.build, this._url);

        } else if (this._url.project) {

            this._sendRequest(this._events.create_table.job, this._url);

        } else {

            this._sendRequest(this._events.create_table.project);
        }
    }

    , onmessage: function(message) {

        function changeEnvironment(buttons) {
            //change button, path, info

            self._elements.buttons.innerHTML = '';
            self._elements.info.innerHTML = '';
            self._elements.path.innerHTML = (self._templates.path || '')
                .replacePHs('url', '')
                .replacePHs('part', 'job') ;

            (buttons || [])
                .forEach(function(item) {
                    self._elements.buttons.html(
                        (self._templates.button || '')
                            .replacePHs('onclick', item.onclick, true)
                            .replacePHs('name', item.name, true));
                });

            var url = {};
            for (var key in self._url) {

                url[key] = self._url[key];

                self._elements.path.html(
                    (self._templates.path || '')
                        .replacePHs('url', url.serialize())
                        .replacePHs('part', url[key]));

                self._elements.info.html(
                    (self._templates.info || '')
                        .replacePHs('key', key.capitalize())
                        .replacePHs('value', url[key]));
            }

            self._elements.title.className = '';
            self._elements.header.className = '';
            self._elements.table.innerHTML = '';

            Hash.set(self._url);
        }

        function createTable(template, message, class_columns) {

            message.data.fs_entries
                .forEach(function(item) {

                    self._elements.table.html(
                        template
                            .replacePHs('url', self._url.serialize(), true)
                            .replacePHs('class', class_columns, true)
                            .replacePHs('item_name', item.name, true)
                            .replacePHs('path_download', item.link, true));
                });
        }

        var buttons = {
            project: [
                {
                    name: 'New project'
                    , onclick: "Project.actionsEntry('createNewFolder','project')"
                }
            ]
            , job: [
                {
                    name: 'New job'
                    , onclick: "Project.actionsEntry('createNewFolder','job')"
                }
                , {
                    name: 'Remove project'
                    , onclick: "Project.actionsEntry('remove')"
                }
            ]
            , build: [
                {
                    name: 'Start'
                    , onclick: "Project.actionsJob('start')"
                }
            ]
            , entry: []
            , property: []
        };
        var self = this;
        var name_message = message.event.split('.');

        // cis. ...
        if (name_message[0] == 'cis') {

            // cis.project...
            if (name_message[1].indexOf('project') == 0) {

                // cis.project... .get.
                if (name_message[2] == 'get') {

                    // cis.project... .get.success
                    if (name_message[3] == 'success') {

                        changeEnvironment(buttons.project);
                        createTable((this._templates.list || ''), message, 'one-columns');
                        this._elements.title.className = 'project-list';
                    }

                // cis.project.info
                } else if (name_message[2] == 'info') {

                    // cis.project.info.success
                    if (name_message[3] == 'success') {

                        changeEnvironment(buttons.job);
                        createTable((this._templates.job || ''), message, 'two-columns');
                    }

                // cis.project.error
                } else if (name_message[2] == 'error') {

                    // cis.project.error.doesnt_exist
                    if (name_message[3] == 'doesnt_exist') {

                        changeEnvironment();
                        this._toastOpen('warning', 'project not found');
                    }
                }

            // cis.job
            } else if (name_message[1] == 'job') {

                // cis.job.info
                if (name_message[2] == 'info') {

                    // cis.job.info.success
                    if (name_message[3] == 'success') {

                        changeEnvironment(buttons.build);

                        this._elements.table.innerHTML = '';

                        var properties = [];
                        var builds = [];

                        message.data.fs_entries
                            .forEach(function(item) {

                                if (item.directory) {
                                    builds.push(item)
                                } else {
                                    properties.push(item);
                                }
                            });

                        for (var i = 0; i < [properties.length, builds.length].max(); i++) {

                            var table_row = {
                                build_name: builds[i] && builds[i].name
                                , build_data: builds[i] && builds[i].metainfo && builds[i].metainfo.date
                                , properties: properties[i] && properties[i].name
                            };

                            var class_columns = {
                                name: ''
                                , date: ''
                                , prop: ''
                            };

                            if (table_row.build_name) {

                                if (table_row.build_data) {

                                    class_columns.name = 'tree-columns';

                                    if (table_row.properties) {

                                        class_columns.date = 'tree-columns';
                                        class_columns.prop = 'tree-columns';

                                    } else {

                                        class_columns.date = 'tree-columns';

                                    }
                                } else {

                                    if (table_row.properties) {

                                        class_columns.name = 'two-one-columns';
                                        class_columns.prop = 'tree-columns';

                                    } else {

                                        class_columns.name = 'one-columns';
                                    }
                                }

                            } else {
                                class_columns.prop = 'one-columns';
                            }

                            self._elements.table.html(
                                (self._templates.build || '')
                                    .replacePHs('url', this._url.serialize())

                                    .replacePHs('prop_name', (table_row.properties || ''))
                                    .replacePHs('build_name', (table_row.build_name || ''))
                                    .replacePHs('build_date', ((table_row.build_data) ? ('Start date: ' + table_row.build_data) : ''))

                                    .replacePHs('class_build', ((class_columns.name) ? class_columns.name : 'template-builds-td'))
                                    .replacePHs('class_date', ((class_columns.date) ? class_columns.date : 'template-builds-td'))
                                    .replacePHs('class_prop', ((class_columns.prop) ? class_columns.prop : 'template-builds-td ')))
                        }

                        this._elements.header.className = 'project-list';
                        this.actionsJob('init', message.data.params);
                    }

                // cis.job.run
                } else if (name_message[2] == 'run') {

                    // cis.job.run.success
                    if (name_message[3] == 'success') {

                        this._toastOpen('info', 'job run success');
                    }

                // cis.job.error
                } else if (name_message[2] == 'error') {

                    // cis.job.error.doesnt_exist
                    if (name_message[3] == 'doesnt_exist') {

                        changeEnvironment();
                        this._toastOpen('warning', 'job not found');

                    // cis.job.error.invalid_params
                    } else if (name_message[3] == 'invalid_params') {

                        this._toastOpen('error', 'error in params');
                    }
                }

            // cis.build
            } else if (name_message[1] == 'build') {

                // cis.build.error
                if (name_message[2] == 'error') {

                    // cis.build.error.doesnt_exist
                    if (name_message[3] = 'doesnt_exist') {

                        changeEnvironment();
                        this._toastOpen('warning', 'build not found');
                    }
                }

            // cis.entry
            } else if (name_message[1] == 'entry') {

                // cis.entry.error
                if (name_message[2] == 'error') {

                    // cis.entry.error.doesnt_exist
                    if (name_message[3] = 'doesnt_exist') {

                        changeEnvironment();
                        this._toastOpen('warning', 'entry not found');
                    }
                }

            // cis.property
            } else if (name_message[1] == 'property') {

                // cis.property.info
                if (name_message[2] == 'info') {

                    // cis.property.info.success
                    if (name_message[3] == 'success') {

                        changeEnvironment(buttons.property);
                        this._elements.table.innerHTML = '';
                    }
                }
            }

        // fs.entry.list.success
        } else if (name_message[0] == 'fs') {

            // fs.entry
            if (name_message[1] == 'entry') {

                // fs.entry.list
                if (name_message[2] == 'list') {

                    // fs.entry.list.success
                    if (name_message[3] == 'success') {

                        changeEnvironment(buttons.entry);
                        createTable((this._templates.entry || ''), message, 'two-columns');
                    }

                // fs.entry.new_dir
                } else if (name_message[2] == 'new_dir') {

                    // fs.entry.new_dir.success
                    if (name_message[3] == 'success') {

                        this._sendRequest(this._events.entry_refresh, {path: this._serialize()});
                    }

                // fs.entry.remove
                } else if (name_message[2] == 'remove') {

                    // fs.entry.remove.success
                    if (name_message[3] == 'success') {

                        this._toastOpen('info', 'remove success');
                        this.sendDataServer();
                    }

                // fs.entry.refresh
                } else if (name_message[2] == 'refresh') {

                    // fs.entry.refresh.success
                    if (name_message[3] == 'success') {

                        this._toastOpen('info', 'create success');
                        this.sendDataServer();
                    }
                }
            }

        //unidentified message
        } else {
            console.warn('not processed message');
        }
    }

    /**
     * Job
     *
     * @param {string} event - Key to action selection
     * @param params - parameter for further actions
     *     Variant
     *         event = 'init' (Initialization of values)
     *         @param {array} params - Default values for request 'run job'
     *             @param {object} - Pair 'key-value'
     *                 @param {string} name  - name of param
     *                 @param {string} value - Default value received from server
     *
     *         event = 'start' (Run job)
     *         @param {bool} params - Pointer to where the function was called
     *             Variant 'true' (function called from the block with the entered parameters) ||
     *             'false' (the function is called from the main block)
     */

    , actionsJob: function(event, params) {

        if (event == 'init') {

            Cookie.set('param_start_job', encodeURIComponent(JSON.stringify(params)));

        } else if (event == 'start') {

            var is_form = params;
            var fields = [];
            if (Cookie.get('param_start_job')) {
                fields = JSON.parse(decodeURIComponent(Cookie.get('param_start_job')));
            }

            if ( is_form || fields.length == 0) {

                this._sendRequest(this._events.action_job.job_run, {
                    project: this._url.project,
                    job: this._url.job,
                    params: fields
                });
                this.formInputData('visible');

            } else if (fields.length != 0) {

                this.formInputData('init',
                    {
                        title_name: 'Set params'
                        , input: {
                            is_input: true
                            , fields: fields
                        }
                        , button: {
                            onclick: "Project.actionsJob('start', true)"
                            , value: 'Start'
                        }
                    });
            }
        }
    }

    /**
     *  Entry
     *
     * @param {string} event - Key to action selection
     * @param params   - Parameter for actions
     *     Variant
     *         event = 'createNewFolder' (Send a request to create a new file)
     *         {string} params - Title form; what will be created ('Project' || 'Job')
     *
     *         event = 'remove' (Remove folder)
     *         {bool} params - Deletion confirmed
     */

    , actionsEntry: function(event, params) {

        if (event == 'createNewFolder') {

            var title_form = '';
            if (params) {
                title_form = params;
            } else {
                return;
            }
            var name_folder = this.formInputData('get')[0];

            if (name_folder && name_folder != '') {

                this._url[title_form] = name_folder;
                this._sendRequest(this._events.action_entry.new_dir, {path: this._serialize()});
                this.formInputData('visible');

            } else if (name_folder == '') {

                this._toastOpen('warning', 'Please, enter a ' + title_form + ' name');

            } else {

                this.formInputData('init',
                    {
                        title_name: 'New ' + title_form
                        , input: {
                            is_input: true
                            , fields: [{name: 'name of New ' + title_form}]
                        }
                        , button: {
                            onclick: "Project.actionsEntry('createNewFolder', '" + title_form + "')"
                            , value: 'Add'
                        }
                    });
            }

        } else if (event == 'remove') {

            var is_remove = params || null;

            if (is_remove) {

                this._sendRequest(this._events.action_entry.remove, {path: this._serialize()});

                delete this._url[Object.keys(this._url).pop()];
                Hash.set(this._url);

                this.formInputData('visible');

            } else {

                this.formInputData('init',
                    {
                        title_name: 'Remove'
                        , input: {
                            fields: [{name: 'Are you sure, that you want to delete file ' + this._serialize()}]
                        }
                        , button: {
                            onclick: "Project.actionsEntry('remove', true)"
                            , value: 'Remove'
                        }
                    });
            }
        }
    }

    /**
     * Form
     *
     * @param {string} event - Key to action selection
     * @param params         - parameter for form actions
     *     Variant
     *         event = 'init' (Set the name of the form, button, onclick event, default param)
     *         @param {obj} params
     *             @param {string} title_name   - (Optional) Name of form
     *             @param {obj} input
     *                 @param {bool} is_input       - (Optional) Is need an input field
     *                 @param {array} fields        - (Optional) Array with obj param
     *                     @param {obj}
     *                         @param {string} name  - (Optional) Field name
     *                         @param {string} value - (Optional) Field value
     *             @param {obj} button          - (Optional) Button options
     *                 @param {string} value       - (Optional) Text on buttons
     *                 @param {string} onclick     - (Optional) Click action
     *
     *         event = 'get' (Get params from form)
     *         @returns {array} - Field values
     *
     *         event = 'visible' (close form)
     */

    , formInputData: function(event, params) {

        var self = this;
        var _elements = {
            params_block: null
            , form: null
            , button: null
            , name: null
        };
        var is_visible = false;

        for (var key in _elements) {

            if (key == 'form'){
                _elements[key] = Selector.id('project-form');
            } else {
                _elements[key] = Selector.id('project-form-' + key.replaceAll('_', '-', true));
            }
        }

        if (event == 'init') {
            // params:
            // title_name
            // input
            //     is_input
            //     fields
            // button
            //     onclick
            //     value

            _elements.params_block.innerHTML = '';
            _elements.name.innerHTML = params.title_name || '';

            (params.input && params.input.fields || [])
                .forEach(function(item) {
                    _elements.params_block.html(
                        (self._templates.form_params_block || '')
                            .replacePHs('param_name', (item.name || ''), true)
                            .replacePHs('param_value', (item.value || ''), true)
                            .replacePHs('class_input', (params.input.is_input || item.value) ? '' : 'form-project-list'))
                });

            _elements.button.html(
                (this._templates.button || '')
                    .replacePHs('onclick', (params.button && params.button.onclick || ''), true)
                    .replacePHs('name', (params.button && params.button.value || ''), true)
                , true);

            event = 'visible';
            is_visible = true;

        } else if (event == 'get') {

            return Selector.queryAll('#project-form-params-block > div > input')
                .map(function(item) {
                    return item.value.trim() || '';
                });

        }
        if (event == 'visible') {

            if (is_visible) {
                _elements.form.className = 'project-param';
            } else {
                _elements.form.className = '';
                _elements.params_block.innerHTML = '';
            }
        }
    }

    , _sendRequest: function(event, data) {

        Socket.send({
            event: event || '',
            transactionId: (new Date()).getTime(),
            data: data || {}
        });
    }
    , _toastOpen: function(type, message) {

        Toast.open({
            type: type
            , text: message
            , delay: 2
        });
    }
    , _serialize: function() {
        var self = this;
        // get the path of the form '/<project.name>/<job.name>/..'
        return '/' + Object.keys(this._url)
            .map(function(item) {
                return self._url[item];
            }).join('/');
    }
};