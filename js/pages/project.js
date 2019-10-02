/**
 * Project, job, file-system
 *
 * Methods:
 * actionsJob     - Methods that are used when clicking buttons of job
 * actionsEntry   - Methods that are used when clicking buttons of entry
 * formInputData  - Methods that are used to work with the data filling form
 * sendDataServer - Methods that are used to move from one table to another
 *     @param {string} path - (Optional) Parameter containing url
 *                                   Line of the form 'project=[v1]&job=[v2]...'
 *
 * init           - Variable initialization
 *
 * onmessage      - Behavior on response from server
 *     @param {object} message - Text of response text of response from server
 *         @param {string} event - Success of action
 *                          Variant 'cis.project_list.get.success' (success get projects list) ||
 *                                  'cis.project.info.success' (success get jobs list) ||
 *                                  'cis.project.error.doesnt_exist' (project not found) ||
 *                                  'cis.job.info.success' (success get builds list) ||
 *                                  'cis.job.run.success' (success job run) ||
 *                                  'cis.job.error.invalid_params' (invalid parameters specified at startup of job) ||
 *                                  'cis.job.error.doesnt_exist' (job not found) ||
 *                                  'cis.build.error.doesnt_exist' (build not found) ||
 *                                  'cis.property.info.success' (go to properties section) ||
 *                                  'cis.entry.error.doesnt_exist' (entry not found) ||
 *                                  'fs.entry.list.success' (success get entry list) ||
 *                                  'fs.entry.refresh.success' (refresh success) ||
 *                                  'fs.entry.new_dir.success' (create new dir success) ||
 *                                  'fs.entry.remove.success' (remove folder success)
 *
 *         @param {obj} data     - Message data
 *             @param {array} fs_entries - Array with record objects
 *                 @param {string} name    - Name of entry
 *                 @param {string} link    - URL to download
 *                 @param {bool} directory - Is this property or build
 *                 @param {obj} metainfo   - Record metadata
 *                     @param {string}date     - (Optional) Start date
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
        response: {
            cis: {
                project_list:           'cis.project_list.get.success'
                , job_list:             'cis.project.info.success'
                , project_doesnt_exist: 'cis.project.error.doesnt_exist'
                , build_list:           'cis.job.info.success'
                , job_run:              'cis.job.run.success'
                , job_doesnt_exist:     'cis.job.error.doesnt_exist'
                , job_invalid_params:   'cis.job.error.invalid_params'
                , build_doesnt_exist:   'cis.build.error.doesnt_exist'
                , property:             'cis.property.info.success'
                , entry_doesnt_exist:   'cis.entry.error.doesnt_exist'
            }
            , fs: {
                entry_list:      'fs.entry.list.success'
                , entry_refresh: 'fs.entry.refresh.success'
                , new_dir :      'fs.entry.new_dir.success'
                , remove:        'fs.entry.remove.success'
            }
        }
        , request:{
            cis: {
                project_list: 'cis.project_list.get'
                , job_list:   'cis.project.info'
                , build_list: 'cis.job.info'
                , job_run:    'cis.job.run'
            }
            , fs: {
                entry_list:      'fs.entry.list'
                , entry_refresh: 'fs.entry.refresh'
                , new_dir :      'fs.entry.new_dir'
                , remove:        'fs.entry.remove'
            }
        }
    }
    , _templates: {}

    , init: function() {

        var self = this;

        if (window.location.href.substr(-1) == '#') {
            window.location = window.location.origin;
        }
        this._url = Hash.get();

        for (var key in this._elements) {
            this._elements[key] =  Selector.id('project' + ((key == 'project') ? '' : ('-' + key)));
        }

        var selector_name = 'template-project-';
        Selector.queryAll('script[id^="' + selector_name + '"]')
            .forEach(function(item) {
                self._templates[item.id
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

            this._sendRequest(this._events.request.fs.entry_list, {path: this._serialize()});

        } else if (this._url.project &&
                    this._url.job &&
                    this._url.name) {

            this.onmessage({event: 'cis.property.info.success'});

        } else if (this._url.project &&
                    this._url.job) {

            this._sendRequest(this._events.request.cis.build_list, this._url);

        } else if (this._url.project) {

            this._sendRequest(this._events.request.cis.job_list, this._url);

        } else {

            this._sendRequest(this._events.request.cis.project_list);
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
        }

        function createTable(template, message, class_columns) {

            message.data.fs_entries
                .forEach(function(item) {

                    self._elements.table.html(
                        (template || '')
                            .replacePHs('url', self._url.serialize(), true)
                            .replacePHs('class', (class_columns || ''), true)
                            .replacePHs('item_name', (item.name || ''), true)
                            .replacePHs('path_download', (item.link || ''), true));
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

        // cis. ...
        if ( ! message.event.indexOf('cis.')) {

            // cis.project_list.get.success
            if (message.event == this._events.response.cis.project_list) {

                changeEnvironment(buttons.project);
                createTable((this._templates.list || ''), message, 'one-columns');
                this._elements.title.className = 'project-list';

            // cis.project.info.success
            } else if (message.event == this._events.response.cis.job_list) {
                changeEnvironment(buttons.job);
                createTable((this._templates.job || ''), message, 'two-columns');

            // cis.project.error.doesnt_exist
            } else if (message.event == this._events.response.cis.project_doesnt_exist) {
                changeEnvironment();
                this._toastOpen('warning', 'project not found');

            // cis.job.info.success
            } else if (message.event == this._events.response.cis.build_list) {

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
                        build_name: (builds[i] || {}).name
                        , build_date: ((builds[i] || {}).metainfo || {}).date
                        , properties: (properties[i] || {}).name
                    };

                    var class_columns = {
                        name: ''
                        , date: ''
                        , prop: ''
                    };

                    if (table_row.build_name) {

                        if (table_row.build_date) {
                            class_columns.name = 'tree-columns';

                            if (table_row.properties) {
                                class_columns.date = 'tree-columns';
                                class_columns.prop = 'tree-columns';

                            } else {
                                class_columns.date = 'two-one-columns';
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
                            .replacePHs('build_date', ((table_row.build_date) ? ('Start date: ' + table_row.build_date) : ''))

                            .replacePHs('class_build', ((class_columns.name) ? class_columns.name : 'template-build-td'))
                            .replacePHs('class_date', ((class_columns.date) ? class_columns.date : 'template-build-td'))
                            .replacePHs('class_prop', ((class_columns.prop) ? class_columns.prop : 'template-build-td ')))
                }

                this._elements.header.className = 'project-list';
                this.actionsJob('init', message.data.params);

            // cis.job.run.success
            } else if (message.event == this._events.response.cis.job_run) {
                this._toastOpen('info', 'job run success');
                this._sendRequest(this._events.request.fs.entry_refresh, {path: this._serialize()});

            // cis.job.error.doesnt_exist
            } else if (message.event == this._events.response.cis.job_doesnt_exist) {
                changeEnvironment();
                this._toastOpen('warning', 'job not found');

            // cis.job.error.invalid_params
            } else if (message.event == this._events.response.cis.job_invalid_params) {
                this._toastOpen('error', 'error in params');

            // cis.build.error.doesnt_exist
            } else if (message.event == this._events.response.cis.build_doesnt_exist) {
                changeEnvironment();
                this._toastOpen('warning', 'build not found');

            // cis.entry.error.doesnt_exist
            } else if (message.event == this._events.response.cis.entry_doesnt_exist) {
                changeEnvironment();
                this._toastOpen('warning', 'entry not found');

            // cis.property.info.success
            } else if (message.event == this._events.response.cis.property) {
                changeEnvironment(buttons.property);
                this._elements.table.innerHTML = '';
            }

        // fs
        } else if ( ! message.event.indexOf('fs.')) {

            // fs.entry.list.success
            if (message.event == this._events.response.fs.entry_list) {
                changeEnvironment(buttons.entry);
                createTable((this._templates.entry || ''), message, 'two-columns');

            // fs.entry.new_dir.success
            } else if (message.event == this._events.response.fs.new_dir) {
                this._toastOpen('info', 'create success');
                this._sendRequest(this._events.request.fs.entry_refresh, {path: this._serialize()});
                Hash.set(this._url);

            // fs.entry.remove.success
            } else if (message.event == this._events.response.fs.remove) {
                this._toastOpen('info', 'remove success');
                delete this._url[Object.keys(this._url).pop()];
                Hash.set(this._url);
                this.sendDataServer();

            // fs.entry.refresh.success
            } else if (message.event == this._events.response.fs.entry_refresh) {
                this.sendDataServer();
            }

        //unidentified message
        } else {
            console.warn('not processed message');
        }
    }

    /**
     * Job
     *
     * @param {string} action - Key to action selection
     * @param params          - Parameter for actions
     *     Variant
     *         action = 'init' (Initialization of values)
     *         @param {array} params - Default values for request 'run job'
     *             @param {object} - Pair 'key-value'
     *                 @param {string} name  - (Optional) Name of param
     *                 @param {string} value - (Optional) Default value received from server
     *
     *         action = 'start' (Run job)
     */

    , actionsJob: function(action, params) {

        if (action == 'init') {

            Cookie.set('param_start_job', encodeURIComponent(JSON.stringify(params)));

        } else if (action == 'start') {

            var fields_form = this.formInputData('get') || [];
            var fields_default = JSON.parse(decodeURIComponent(Cookie.get('param_start_job')));

            if (( ! fields_default.length) || fields_form.length) {

                this._sendRequest(this._events.request.cis.job_run,{
                    project: this._url.project,
                    job: this._url.job,
                    params: fields_form
                });
                this.formInputData('visible');

            } else {

                this.formInputData('init',
                    {
                        title_name: 'Set params'
                        , input: {
                            is_input: true
                            , fields: fields_default
                        }
                        , button: {
                            onclick: "Project.actionsJob('start')"
                            , value: 'Start'
                        }
                    });
            }
        }
    }

    /**
     *  Entry
     *
     * @param {string} action - Key to action selection
     * @param params          - Parameter for actions
     *     Variant
     *         action = 'createNewFolder' (Send a request to create a new file)
     *         {string} params - Title form; what will be created ('Project' || 'Job')
     *
     *         action = 'remove' (Remove folder)
     *         {bool} params - Deletion confirmed
     */

    , actionsEntry: function(action, params) {

        if (action == 'createNewFolder') {

            var title_form = '';
            if (params) {
                title_form = params;
            } else {
                return;
            }
            var name_folder = (this.formInputData('get')[0] || {}).value;

            if (name_folder && name_folder != '') {

                this._url[title_form] = name_folder;
                this._sendRequest(this._events.request.fs.new_dir, {path: this._serialize()});
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

        } else if (action == 'remove') {

            var is_remove = params;

            if (is_remove) {

                this._sendRequest(this._events.request.fs.remove, {path: this._serialize()});

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
     * @param {string} action - Key to action selection
     * @param params          - Parameter for form actions
     *     Variant
     *         action = 'init' (Set the name of the form, button, onclick event, default param)
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
     *         action = 'get' (Get params from form)
     *         @returns {array} - Array of objects with input param
     *             {
     *                 @param {string} name - Name of value
     *                 @param {string} value - Input value
     *             }
     *
     *         action = 'visible' (close form)
     */

    , formInputData: function(action, params) {

        var self = this;
        var _elements = {
            params: null
            , form: null
            , button: null
            , name: null
        };
        var is_visible = false;

        for (var key in _elements) {

            _elements[key] = Selector.id('project-form' + ((key == 'form') ?  '' : ('-' + key)));
        }

        if (action == 'init') {
            // params:
            // title_name
            // input
            //     is_input
            //     fields
            // button
            //     onclick
            //     value

            _elements.params.innerHTML = '';
            _elements.name.innerHTML = params.title_name || '';

            ((params.input || {}).fields || [])
                .forEach(function(item) {
                    _elements.params.html(
                        (self._templates.form_params || '')
                            .replacePHs('param_name', (item.name || ''), true)
                            .replacePHs('param_value', (item.value || ''), true)
                            .replacePHs('class_input', (params.input.is_input || item.value) ? '' : 'form-project-list'))
                });

            _elements.button.html(
                (this._templates.button || '')
                    .replacePHs('onclick', ((params.button || {}).onclick || ''), true)
                    .replacePHs('name', ((params.button || {}).value || ''), true)
                , true);

            action = 'visible';
            is_visible = true;

        } else if (action == 'get') {

            var names = Selector.queryAll('#project-form-params > div > span');
            var values = Selector.queryAll('#project-form-params > div > input');

            var result = [];
            for (var i = 0; i < names.length; i++) {
                result.push({
                    name: names[i].innerHTML
                    , value: values[i].value.trim()
                });
            }
            return result;
        }
        if (action == 'visible') {

            if (is_visible) {
                _elements.form.className = 'project-param';
            } else {
                _elements.form.className = '';
                _elements.params.innerHTML = '';
            }
        }
    }

    , _sendRequest: function(event, data) {

        if ( ! event) {
            return;
        }

        Socket.send({
            event: event,
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