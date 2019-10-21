/**
 * Project, job, file-system
 *
 * Methods:
 * actionsJob     - Methods that are used when clicking buttons of job
 * actionsEntry   - Methods that are used when clicking buttons of entry
 * formInputData  - Methods that are used to work with the data filling form
 * sendDataServer - Methods that are used to move from one table to another
 *     @param {string} path - (Optional) Parameter containing url
 *                                   Line of the form 'project=[name project]&job=[name job]...'
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
 *                                  'cis.build.info.success' (success get entry list) ||
 *                                  'cis.build.error.doesnt_exist' (build not found) ||
 *                                  'cis.property.info.success' (go to properties section) ||
 *                                  'cis.entry.error.doesnt_exist' (entry not found) ||
 *                                  'fs.entry.list.success' (get any fs_list) ||
 *                                  'fs.entry.refresh.success' (refresh success) ||
 *                                  'fs.entry.new_dir.success' (create new dir success) ||
 *                                  'fs.entry.remove.success' (remove folder success) ||
 *                                  'fs.entry.error.cant_create_dir' (can't create dir)
 *
 *         @param {obj} data     - (Optional) Message data
 *             @param {status} number    - (Optional) Exit code
 *             @param {string} date      - (Optional) Start date
 *             @param {array} fs_entries - (Optional) Array with record objects
 *                 @param {string} name    - Name of entry
 *                 @param {string} link    - (Optional) URL to download
 *                 @param {bool} directory - (Optional) Is this property or build
 *                 @param {obj} metainfo   - (Optional) Record metadata
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
                , entry_list:           'cis.build.info.success'
                , build_doesnt_exist:   'cis.build.error.doesnt_exist'
                , property:             'cis.property.info.success'
                , entry_doesnt_exist:   'cis.entry.error.doesnt_exist'
            }
            , fs: {
                any_entries_list: 'fs.entry.list.success'
                , entry_refresh:  'fs.entry.refresh.success'
                , new_dir :       'fs.entry.new_dir.success'
                , remove:         'fs.entry.remove.success'
                , error_dir:      'fs.entry.error.cant_create_dir'
            }
        }
        , request: {
            cis: {
                project_list: 'cis.project_list.get'
                , job_list:   'cis.project.info'
                , build_list: 'cis.job.info'
                , job_run:    'cis.job.run'
                , entry_list: 'cis.build.info'
            }
            , fs: {
                any_entries_list: 'fs.entry.list'
                , entry_refresh:  'fs.entry.refresh'
                , new_dir :       'fs.entry.new_dir'
                , remove:         'fs.entry.remove'
                , move:           'fs.entry.move'
            }
        }
    }
    , _templates: {}

    , init: function() {

        var self = this;
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

    , sendDataServer: function() {

        var self = this;
        this._url = Hash.get();

        if (this._url.project &&
            this._url.job &&
            this._url.build) {

            this._sendRequest(this._events.request.cis.entry_list, this._url);

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
            self._elements.path.html(
                (self._templates.path || '')
                    .replacePHs('url', '')
                    .replacePHs('part', 'job'), true) ;

            (buttons || [])
                .forEach(function(item) {

                    self._elements.buttons.html(
                        (self._templates.button || '')
                            .replacePHs('onclick', item.onclick, true)
                            .replacePHs('name', item.name));
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

            (message.data || {}).fs_entries
                .forEach(function(item) {

                    self._elements.table.html(
                        (template || '')
                            .replacePHs('url', self._url.serialize(), true)
                            .replacePHs('class', (class_columns || ''))
                            .replacePHs('item_name', (item.name || ''), true)
                            .replacePHs('path_download', (item.link || ''), true));
                });
        }

        var self = this;
        var buttons = {
            project: [
                {
                    name: 'New project'
                    , onclick: "Project.actionsEntry('createNewFolder','project')"
                }
            ]
            , job: [
                {
                    name: 'New dir'
                    , onclick: "Project.actionsEntry('createNewFolder','job')"
                }
                , {
                    name: 'Remove project'
                    , onclick: "Project.actionsEntry('remove')"
                }
                , {
                    name: 'New job'
                    , onclick: ""
                }
            ]
            , build: [
                {
                    name: 'Start'
                    , onclick: "Project.actionsJob('start')"
                }
                , {
                    name: 'Add file'
                    , onclick: "Project.actionsBuild('addBuild', {name: 'file'})"
                }
                , {
                    name: 'Add params'
                    , onclick: "Project.actionsBuild('addBuild', {name: 'params', accept: '.params'})"
                }
                , {
                    name: 'Add readme'
                    , onclick: "Project.actionsBuild('addBuild', {name: 'readme', accept: '.md, .txt'})"
                }
            ]
            , entry: [
                {
                    name: 'Add test'
                    , onclick: "Project.actionsBuild('addBuild', {name: 'test', accept: '.md, .txt'})"
                }
            ]
            , property: [
                {
                    name: 'Save'
                    , onclick: ""
                }
            ]
        };

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

                changeEnvironment(buttons.project);
                this._toastOpen('warning', 'project not found');

            // cis.job.info.success
            } else if (message.event == this._events.response.cis.build_list) {

                changeEnvironment(buttons.build);
                this._elements.table.innerHTML = '';

                var properties = [];
                var builds = [];

                (message.data || {}).fs_entries
                    .forEach(function(item) {

                        if (item.directory) {
                            builds.push(item)
                        } else {
                            properties.push(item);
                        }
                    });

                for (var i = 0; i < [properties.length, builds.length].max(); i++) {

                    var table_row = {
                        name: (builds[i] || {}).name
                        , date: ((builds[i] || {}).metainfo || {}).date
                        , prop: (properties[i] || {}).name
                    };
                    var class_columns = {
                        name: ''
                        , date: ''
                        , prop: ''
                    };

                    Object.keys(table_row)
                        .reduceRight(function (count, item) {

                            if (table_row[item]) {

                                if (count == 3 || ! table_row.name) {
                                    class_columns[item] = 'one-columns';
                                } else if (count == 2) {
                                    class_columns[item] = 'two-one-columns';
                                } else if (count == 1) {
                                    class_columns[item] = 'tree-columns';
                                }
                                return 1;

                            } else {
                                return ++count;
                            }

                        }, 1);

                    // or
                    // var count = 1;
                    // Object.keys(table_row)
                    //     .reverse()
                    //     .forEach(function (item) {
                    //
                    //         if (table_row[item]) {
                    //
                    //             if (count == 3 || ! table_row.name) {
                    //                 class_columns[item] = 'one-columns';
                    //             } else if (count == 2) {
                    //                 class_columns[item] = 'two-one-columns';
                    //             } else if (count == 1) {
                    //                 class_columns[item] = 'tree-columns';
                    //             }
                    //             count = 1;
                    //
                    //         } else {
                    //             count++;
                    //         }
                    //     });
                    
                    self._elements.table.html(
                        (self._templates.build || '')
                            .replacePHs('url', this._url.serialize())

                            .replacePHs('prop_name', (table_row.prop || ''))
                            .replacePHs('build_name', (table_row.name || ''))
                            .replacePHs('build_date', ((table_row.date) ? ('Start date: ' + table_row.date) : ''))

                            .replacePHs('class_build', ((class_columns.name) ? class_columns.name : 'template-build-td'))
                            .replacePHs('class_date', ((class_columns.date) ? class_columns.date : 'template-build-td'))
                            .replacePHs('class_prop', ((class_columns.prop) ? class_columns.prop : 'template-build-td ')))
                }

                this._elements.header.className = 'project-list';
                this.actionsJob('init', (message.data || {}).params);

            // cis.job.run.success
            } else if (message.event == this._events.response.cis.job_run) {

                this._toastOpen('info', 'job run success');
                this._sendRequest(this._events.request.fs.entry_refresh, {path: this._serialize()});

            // cis.job.error.doesnt_exist
            } else if (message.event == this._events.response.cis.job_doesnt_exist) {

                changeEnvironment(buttons.build);
                this._toastOpen('warning', 'job not found');

            // cis.job.error.invalid_params
            } else if (message.event == this._events.response.cis.job_invalid_params) {

                this._toastOpen('error', 'error in params');

            // cis.build.info.success
            } else if (message.event == this._events.response.cis.entry_list) {

                changeEnvironment(buttons.entry);
                if ((message.data || {}).date) {
                    this._elements.info.html(
                        (self._templates.info || '')
                            .replacePHs('key', 'Start date')
                            .replacePHs('value', message.data.date));
                }
                if (typeof ((message.data || {}).status) == "number") {
                    this._elements.table.html(
                        (this._templates.entry || '')
                            .replacePHs('class', 'two-columns exitcode')
                            .replacePHs('item_name', 'exitcode: ' + message.data.status)
                            .replacePHs('path_download', '', true));
                }

                createTable((this._templates.entry || ''), message, 'two-columns');

            // cis.build.error.doesnt_exist
            } else if (message.event == this._events.response.cis.build_doesnt_exist) {

                changeEnvironment(buttons.entry);
                this._toastOpen('warning', 'build not found');

            // cis.entry.error.doesnt_exist
            } else if (message.event == this._events.response.cis.entry_doesnt_exist) {

                changeEnvironment(buttons.entry);
                this._toastOpen('warning', 'entry not found');

            // cis.property.info.success
            } else if (message.event == this._events.response.cis.property) {

                changeEnvironment(buttons.property);
                this._elements.table.innerHTML = '';
            }

        // fs
        } else if ( ! message.event.indexOf('fs.')) {

            // fs.entry.list.success
            if (message.event == this._events.response.fs.any_entries_list) {
                //list_entries

            // fs.entry.new_dir.success
            } else if (message.event == this._events.response.fs.new_dir) {

                Hash.set(this._url);
                this.sendDataServer();
                this._sendRequest(this._events.request.fs.entry_refresh, {path: this._serialize()});
                this._toastOpen('info', 'create success');

            // fs.entry.remove.success
            } else if (message.event == this._events.response.fs.remove) {

                delete this._url[Object.keys(this._url).pop()];
                Hash.set(this._url);
                this._sendRequest(this._events.request.fs.entry_refresh, {path: this._serialize()});
                this._toastOpen('info', 'remove success');

            // fs.entry.refresh.success
            } else if (message.event == this._events.response.fs.entry_refresh) {
                //refresh

            // fs.entry.error.cant_create_dir
            } else if (message.event == this._events.response.fs.error_dir) {

                this._toastOpen('error', 'Please enter a different name');
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
     * @param params          - (Optional) Parameter for actions
     *     Variant
     *         action = 'init' (Initialization of values)
     *         @param {array} params  - Default values for request 'run job'
     *             @param {object}       - Pair 'key-value'
     *                 @param {string} name  - (Optional) Name of param
     *                 @param {string} value - (Optional) Default value received from server
     *
     *         action = 'start' (Run job)
     *         action = 'changeName
     *         @param {string} params - Old name
     */

    , actionsJob: function(action, params) {

        if (action == 'init') {

            Cookie.set('param_start_job', encodeURIComponent(JSON.stringify(params || [])));

        } else if (action == 'start') {

            var fields_form = this.formInputData('get', {is_encode: true}) || [];
            var fields_default = JSON.parse(decodeURIComponent(Cookie.get('param_start_job') || '%5B%5D'));

            if ( ! fields_default.length || fields_form.length) {

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

        } else if (action == 'changeName') {

            var new_name = ((this.formInputData('get', {is_required: true}) || [])[0] || {}).value || '';

            if (new_name) {

                //change_name

                this.formInputData('visible');

            } else {

                this.formInputData('init',
                    {
                        title_name: 'Change name'
                        , input: {
                            fields: [{
                                name: 'new name:'
                                , value: params
                            }]
                        }
                        , button: {
                            onclick: "Project.actionsJob('changeName','" + params + "')"
                            , value: 'Change (Don\'t work)'
                        }
                    });
            }
        }
    }

//Build
    , actionsBuild: function(action, params) {

        if (action == 'addBuild') {
            // params
            //    name
            //    accept

            var new_files = this.formInputData('get', {is_required: true}) || [];

            if ( ! new_files.length) {

                params.name = params.name || '';
                params.accept = params.accept || '';

                this.formInputData('init', {
                    title_name: 'Add ' + params.name
                    , input: {
                        is_input: true
                        , type: "file"
                        , file: {
                            accept: params.accept
                            , multiple: (params.name == 'file') ? true : false
                            , webkitdirectory: (params.name == 'file') ? true : false
                        }
                        , fields: [{name: 'change ' + (params.accept || 'folder with') + ' file'}]
                    }
                    , button: {
                        value: "Add (Don\'t work)"
                        , onclick: "Project.actionsBuild('addBuild', {name: '" + params.name + "', accept: '" + params.accept +  "'})"
                    }
                });

            } else {

                var filename = {
                    name: 'new_files'
                    , files: {
                        uploadfile: new_files
                    }
                };

                var a = {
                    url: '/upload/' + this._url.serialize()
                    , method: 'POST'
                    , data: filename
                    , events: {
                        wait: function() {
                            console.log('wait');
                        }
                        , success: function(data) {
                            console.log(data);
                        }
                        , error: function(text, xhr) {}
                        , progress: function() {}
                    }
                };

                console.log('Look param for AJAX:');
                console.log(a);
                AJAX(a);
                this.formInputData('visible');
            }
        }
    }

    /**
     *  Entry
     *
     * @param {string} action - Key to action selection
     * @param params          - (Optional)Parameter for actions
     *     Variant
     *         action = 'createNewFolder' (Send a request to create a new file)
     *         {string} params - Title form; what will be created ('Project' || 'Job')
     *
     *         action = 'remove' (Remove folder)
     *         {bool} params   - Deletion confirmed
     */

    , actionsEntry: function(action, params) {

        if (action == 'createNewFolder') {

            var title_form = '';
            if (params) {
                title_form = params;
            } else {
                return;
            }
            var name_folder =((this.formInputData('get', {is_required: true}) || [])[0] || {}).value || '';

            if (name_folder) {

                this._sendRequest(this._events.request.fs.new_dir, {path: this._serialize() + '/' + name_folder});
                this.formInputData('visible');

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

            var is_remove = params || false;

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
                this.formInputData('visible', {is_visible: true});
            }
        } else if (action == 'download') {

            // var url = this._serialize(Hash.get());
            //
            // var a = {
            //     url: this._serialize(Hash.get())
            //     , method: 'GET'
            //     , events: {
            //         wait: function() {
            //             console.log('wait');
            //         }
            //         , success: function(data) {
            //             console.log(data);
            //         }
            //         , error: function(text, xhr) {}
            //         , progress: function() {}
            //     }
            // };
            // console.log(a);

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
     *             @param {string} title_name - (Optional) Name of form
     *             @param {obj} input         - (Optional) Input options
     *                 @param {bool} is_input   - (Optional) Is need input fields
     *                 @param {array} fields    - (Optional) Array with obj param
     *                     @param {obj}
     *                         @param {string} name  - (Optional) Field name
     *                         @param {string} value - (Optional) Field value
     *             @param {obj} button        - (Optional) Button options
     *                 @param {string} value    - (Optional) Text on buttons
     *                 @param {string} onclick  - (Optional) Click action
     *
     *         action = 'get' (Get params from form)
     *             @param {obj} params
     *                 @param {bool} is_required - (Optional) Is param required
     *                 @param {bool} is_encode   - (Optional) Is special characters allowed
     *             @returns {array} - Array of objects with input param
     *                 @param {obj}
     *                     @param {string} name  - Name of value
     *                     @param {string} value - Input value
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
        var is_visible = (params || {}).is_visible || false;

        for (var key in _elements) {
            _elements[key] = Selector.id('project-form' + ((key == 'form') ?  '' : ('-' + key)));
        }
        if (action == 'init') {
            // params:
            //   title_name
            //   input
            //       is_input
            //       fields
            //       type
            //       file
            //           multiple
            //           accept
            //           webkitdirectory
            //   button
            //       onclick
            //       value

            params = params || {};
            _elements.params.innerHTML = '';
            _elements.name.innerHTML = params.title_name || '';

console.log('Look params.input:');
console.log(params.input);
            var other_attributes = '';
            if ((params.input || {}).file) {

                if (params.input.file.accept) {
                    other_attributes += ' accept="' + params.input.file.accept + '"'
                }
                if (params.input.file.multiple) {
                    other_attributes += ' multiple=true';
                }
                if (params.input.file.webkitdirectory) {
                    other_attributes += ' webkitdirectory=true';
                }
            }
            ((params.input || {}).fields || [{}])
                .forEach(function(item) {
                    _elements.params.html(
                        (self._templates.form_params || '')
                            .replacePHs('param_name', (item.name || ''), true)
                            .replacePHs('param_value', (item.value || ''), true)
                            .replacePHs('type_input', (params.input.type || 'text'))
                            .replacePHs('class_input', ((params.input.is_input || item.value) ? '' : 'form-project-list'))
                            .replacePHs('other_attributes', other_attributes))
                });

            _elements.button.html(
                (this._templates.button || '')
                    .replacePHs('onclick', ((params.button || {}).onclick || ''), true)
                    .replacePHs('name', ((params.button || {}).value || ''))
                , true);

            action = 'visible';
            is_visible = true;

        } else if (action == 'get') {
            // params:
            //     is_required
            //     is_encode

            var values = Selector.queryAll('#project-form-params > div > input');
            var is_correct = true;

            if ((params || {}).is_required) {

                values
                    .forEach(function(item) {

                        if (item.value.trim() == '') {
                            self._toastOpen('warning', 'Please enter a value');
                            is_correct = false;
                        }
                    })
            }
            if ( ! (params || {}).is_encode) {
                values
                    .forEach(function (item) {

                        if (item.value != item.value.encode()) {
                            is_correct = false;
                            self._toastOpen('warning', 'Please, enter value without \' \" & < >');
                        }
                    })
            }
            if ((values[0] || {}).type == 'file') {
                return (values[0] || {}).files;
            }

            if (is_correct) {

                return Selector.queryAll('#project-form-params > div > span')
                    .map(function (item, index) {
                        return {
                            name: item.innerHTML
                            , value: values[index].value.trim()
                        }
                    });
            }
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

        var delay;
        var is_close = false;

        if (type == 'error' ||
            type == 'warning') {
            is_close = true;

        } else {
            delay = 2
        }

        Toast.open({
            type: type
            , text: message
            , delay: delay
            , button_close: is_close
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

addEventListener("popstate",function(e) {
    // if (window.location.href.indexOf('download') == -1) {
        Project.sendDataServer();
    // }
});