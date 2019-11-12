/**
 * Project, job, file-system
 *
 * Methods:
 * action   - Methods that are used when clicking buttons of entry
 * send     - Methods that are used to move from one table to another
 *     @param {string} path - (Optional) Parameter containing url
 *                                   Line of the form 'project=[name project]&job=[name job]...'
 *
 * init     - Variable initialization
 *
 * onmessage    - Behavior on response from server
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
 *                     @param {string} date - (Optional) Start date
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
                // errors
                project_doesnt_exist:   'cis.project.error.doesnt_exist'
                , job_invalid_params:   'cis.job.error.invalid_params'
                , job_doesnt_exist:     'cis.job.error.doesnt_exist'
                , build_doesnt_exist:   'cis.build.error.doesnt_exist'

                // success
                , project_list: 'cis.project_list.get.success'
                , job_list:     'cis.project.info.success'
                , build_list:   'cis.job.info.success'
                , job_run:      'cis.job.run.success'
                , entry_list:   'cis.build.info.success'
                , property:     'cis.property.info.success'
            }
            , fs: {
                // errors
                invalid_path:   'fs.entry.error.invalid_path'
                , doesnt_exist: 'fs.entry.error.doesnt_exist'
                , error_dir:    'fs.entry.error.cant_create_dir'
                , move_cant:    'fs.entry.error.cant_move'

                // successes
                , list:     'fs.entry.list.success'
                , refresh:  'fs.entry.refresh.success'
                , new_dir:  'fs.entry.new_dir.success'
                , remove:   'fs.entry.remove.success'
                , move:     'fs.entry.move.success'

            }
        }
        , request: {
            cis: {
                project_list:   'cis.project_list.get'
                , job_list:     'cis.project.info'
                , build_list:   'cis.job.info'
                , job_run:      'cis.job.run'
                , entry_list:   'cis.build.info'
            }
            , fs: {
                list:       'fs.entry.list'
                , refresh:  'fs.entry.refresh'
                , new_dir:  'fs.entry.new_dir'
                , remove:   'fs.entry.remove'
                , move:     'fs.entry.move'
            }
        }
    }
    , _templates: {}

    , _messages: [
        'cis'
        , 'fs'
    ]

    , _last_file_content: ''

    , init: function() {

        var self = this;
        this._url = Hash.get();

        for (var key in this._elements) {
            this._elements[key] =  Selector.id('project' + ((key == 'project') ? '' : ('-' + key)));
        }

        var selector_name = 'template-project-';
        Selector.queryAll('script[id^="' + selector_name + '"]')
            .forEach(function(item) {
                self._templates[(item.id
                        .replaceAll(selector_name,'')
                        .replaceAll('-','_')
                    )] = item.innerHTML.trim();
            });

        this.send();
    }

    , send: function() {

        this._url = Hash.get();

        if (this._url.project &&
                this._url.job &&
                this._url.build) {

            this._sendRequest(this._events.request.cis.entry_list, this._url);

        } else if (this._url.project &&
                this._url.job &&
                this._url.name) {

            this.onmessage({event: this._events.response.cis.property});

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

        var self = this;

        function changeEnvironment(buttons) {
            //change button, path, info

            self._elements.buttons.innerHTML = '';
            self._elements.info.innerHTML = '';
            self._elements.path.html(
                (self._templates.path || '')
                    .replacePHs('url', '')
                    .replacePHs('part', 'job'), true);

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

        function createTable(template, message) {

            (message.data || {}).fs_entries
                .forEach(function(item) {
                    self._elements.table.html(
                        (template || '')
                            .replacePHs('rename_event', ("Project.modal('rename', { value: '%%item_name%%' })"), true)
                            .replacePHs('url', self._url.serialize(), true)
                            .replacePHs('item_name', (item.name || ''), true)
                            .replacePHs('path_download', (item.link || ''), true));
                });
        }

        var buttons = {
            project: [
                {
                    name: 'New project'
                    , onclick: "Project.modal('addDir', {type: 'project'});"
                }
            ]
            , job: [
                {
                    name: 'New dir'
                    , onclick: "Project.modal('addDir', {type: 'job'});"
                }
                , {
                    name: 'Remove project'
                    , onclick: "Project.modal('remove');"
                }
                , {
                    name: 'New job'
                    , onclick: "Project.modal('addJob', {type: 'job'});"
                }
            ]
            , build: [
                {
                    name: 'Start'
                    , onclick: "Project.modal('startJob');"
                }
                , {
                    name: 'Add file(-s)'
                    , onclick: "Project.modal('addFile', {name: 'file'});"
                }
                , {
                    name: 'Add params'
                    , onclick: "Project.modal('addFile', {name: 'params', accept: '.params'});"
                }
                , {
                    name: 'Add readme'
                    , onclick: "Project.modal('addFile', {name: 'readme', accept: '.md, .txt'});"
                }
            ]
            , entry: [
                {
                    name: 'Add file(-s)'
                    , onclick: "Project.modal('addFile', {name: 'file'});"
                }
            ]
            , file: [
                {
                    name: 'Replace content to...'
                    , onclick: ''
                }
            ]
            , property: [
                {
                    name: 'Save'
                    , onclick: ''
                }
            ]
        };

        // cis. ...
        if ( ! message.event.indexOf('cis.')) {

            // cis.project.error.doesnt_exist
            // cis.job.error.doesnt_exist
            // cis.job.error.invalid_params
            // cis.build.error.doesnt_exist
            if ([
                    this._events.response.cis.project_doesnt_exist
                    , this._events.response.cis.job_doesnt_exist
                    , this._events.response.cis.job_invalid_params
                    , this._events.response.cis.build_doesnt_exist
                ].inArray(message.event)) {

                // cis.project.error.doesnt_exist
                if (message.event == this._events.response.cis.project_doesnt_exist) {

                    changeEnvironment(buttons.project);

                // cis.job.error.doesnt_exist
                } else if (message.event == this._events.response.cis.job_doesnt_exist) {

                    changeEnvironment(buttons.build);

                // cis.build.error.doesnt_exist
                } else if (message.event == this._events.response.cis.build_doesnt_exist) {

                    changeEnvironment(buttons.entry);
                }

                Toast.message('error', message.errorMessage);

            // cis.project_list.get.success
            } else if (message.event == this._events.response.cis.project_list) {

                changeEnvironment(buttons.project);
                createTable((this._templates.list || ''), message);
                this._elements.title.className = 'project-list';

            // cis.project.info.success
            } else if (message.event == this._events.response.cis.job_list) {

                changeEnvironment(buttons.job);
                createTable((this._templates.job || ''), message);

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

                    this._elements.table.html(
                        (this._templates.build || '')
                            .replacePHs('url', this._url.serialize())

                            .replacePHs('prop_name', (table_row.prop || ''))
                            .replacePHs('build_name', (table_row.name || ''))
                            .replacePHs('build_date', ((table_row.date) ? ('Start date: ' + table_row.date) : ''))

                            .replacePHs('class', (table_row.prop ? '' : 'hidden'))
                    );
                }

                this._elements.header.className = 'project-list';
                Cookie.set('param_start_job', encodeURIComponent(JSON.stringify(((message.data || {}).params || []))));

            // cis.job.run.success
            } else if (message.event == this._events.response.cis.job_run) {

                this._sendRequest(this._events.request.fs.refresh, { path: this._serialize() });
                Toast.message('info', 'job run success');

            // cis.build.info.success
            } else if (message.event == this._events.response.cis.entry_list) {

                if ('file' in Project._url) {

                    changeEnvironment(buttons.file);

                    var item_file = ((message.data || {}).fs_entries || [])
                        .filter(function(item) {
                            return self._url.file == item.name;
                        })[0];

                    if ( ! item_file) {
                        Toast.message('error', 'Server error. Try again later.');
                        return;
                    }

                    self._elements.table.html(
                        (this._templates.file || '')
                            .replacePHs('link', item_file.link)
                    );

                    setTimeout(function() {
                        self._last_file_content = '';

                        var textarea = Selector.id('file-content');
                        var file_save = Selector.query('#project-table > div.file-row > div.file-cell > .custom-button');

                        addEvent(Selector.query('#project-buttons > div'), 'click', function() {
                            var temp_input = document.createElement('input');

                            temp_input.type = 'file';
                            temp_input.click();

                            temp_input.onchange = function() {
                                var reader = new FileReader();
                                reader.onload = function() {
                                    textarea.value = this.result;
                                    file_save.setAttribute('data-disabled', '');
                                };
                                reader.readAsText(this.files[0]);
                            };
                        });

                        AJAX({
                            url: item_file.link
                            , method: 'GET'
                            , data: {}
                            , events: {
                                wait: function() {
                                    html.addClass('wait');
                                }
                                , success: function(data) {
                                    textarea.innerHTML = data;
                                    self._last_file_content = textarea.value;
                                    html.removeClass('wait');
                                }
                                , error: function(text, xhr) {

                                    html.removeClass('wait');
                                }
                            }
                        });

                        addEvent(textarea, ['keyup', 'focus', 'blur'], function() {
                            if (this.value == self._last_file_content) {
                                file_save.setAttribute('data-disabled', 'disabled');
                            } else {
                                file_save.setAttribute('data-disabled', '');
                            }
                        });

                        addEvent(file_save, 'click', function() {
                            if (file_save.getAttribute('data-disabled') == 'disabled') {
                                return;
                            }

                            var link = JSON.parse(JSON.stringify(self._url));
                            delete link.file;

                            AJAX({
                                url: '/replace' + self._serialize(link)
                                , method: 'POST'
                                , data: {
                                    files: {
                                        file: new File([new Blob([textarea.value])], self._url.file)
                                    }
                                }
                                , events: {
                                    wait: function() {
                                        html.addClass('wait');
                                    }
                                    , success: function() {
                                        file_save.setAttribute('data-disabled', 'disabled');
                                        Toast.message('success', 'File saved');
                                    }
                                    , error: function(text, xhr) {
                                        switch(xhr.status * 1) {
                                            case 404:
                                                Toast.message('error', 'File deleted');
                                                break;
                                            default:
                                                Toast.message('error', 'File save error');
                                        }
                                        html.removeClass('wait');
                                    }
                                }
                            });
                        });
                    }, 0);

                } else {

                    changeEnvironment(buttons.entry);

                    if ((message.data || {}).date) {
                        this._elements.info.html(
                            (this._templates.info || '')
                                .replacePHs('key', 'Start date')
                                .replacePHs('value', message.data.date)
                        );
                    }
                    if (typeof ((message.data || {}).status) == "number") {
                        this._elements.info.html(
                            (this._templates.info || '')
                                .replacePHs('key', 'exitcode')
                                .replacePHs('value', message.data.status)
                        );
                    }

                    createTable((this._templates.entry || ''), message);

                }

            // cis.property.info.success
            } else if (message.event == this._events.response.cis.property) {

                changeEnvironment(buttons.property);
                this._elements.table.innerHTML = '';
            }

        // fs
        } else if ( ! message.event.indexOf('fs.')) {

            // fs.entry.error.invalid_path
            // fs.entry.error.doesnt_exist
            // fs.entry.error.cant_create_dir
            // fs.entry.error.cant_move
            if ([
                    this._events.response.fs.invalid_path
                    , this._events.response.fs.doesnt_exist
                    , this._events.response.fs.error_dir
                    , this._events.response.fs.move_cant
                ].inArray(message.event)) {

                Toast.message('error', message.errorMessage);

            // fs.entry.list.success
            } else if (message.event == this._events.response.fs.list) {

                this._sendRequest(this._events.request.fs.refresh, { path: this._serialize() });

            // fs.entry.refresh.success
            } else if (message.event == this._events.response.fs.refresh) {

                location.reload();

            // fs.entry.new_dir.success
            } else if (message.event == this._events.response.fs.new_dir) {

                Hash.set(this._url);
                this.send();
                // this._sendRequest(this._events.request.fs.refresh, { path: this._serialize() });
                Toast.message('info', 'create success');

            // fs.entry.remove.success
            } else if (message.event == this._events.response.fs.remove) {

                delete this._url[Object.keys(this._url).pop()];
                Hash.set(this._url);
                this._sendRequest(this._events.request.fs.refresh, { path: this._serialize() });
                Toast.message('info', 'remove success');

            // fs.entry.move.success
            } else if (message.event == this._events.response.fs.move) {

                Hash.set(this._url);
                this._sendRequest(this._events.request.fs.refresh, { path: this._serialize() });

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
     *         action = 'changeName'
     *         @param {string} params - Old name
     */
    , actionsJob: function(action, params) {

        var self = this;

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
                            onclick: "Project.actionsJob('start');"
                            , value: 'Start'
                        }
                    });
            }

        } else if (action == 'changeName') {

            var new_name = ((this.formInputData('get', {is_required: true}) || [])[0] || {}).value || '';

            if (new_name) {

                var obj = {
                    oldPath: [
                        ''
                        , params
                    ]
                    , newPath: [
                        ''
                        , new_name
                    ]
                };

                if ('project' in this._url) {
                    Object.keys(obj)
                        .forEach(function(key) {
                            obj[key].splice(1, 0, self._url['project']);
                        });
                }

                Object.keys(obj)
                    .forEach(function(key) {
                        obj[key] = obj[key].join('/');
                    });

                this._sendRequest(this._events.request.fs.move, obj);

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
                            onclick: "Project.actionsJob('changeName', '" + params + "');"
                            , value: 'Change'
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
                            , multiple: (params.name == 'file')
                            , webkitdirectory: (params.name == 'file')
                        }
                        , fields: [{name: 'change ' + (params.accept || 'folder with') + ' file'}]
                    }
                    , button: {
                        value: "Add (Don't work)"
                        , onclick: "Project.actionsBuild('addBuild', {name: '" + params.name + "', accept: '" + params.accept +  "'});"
                    }
                });

            } else {

                var filename = {
                    name: 'new_files'
                    , files: {
                        uploadfile: new_files
                    }
                };

                AJAX({
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
                });

                this.formInputData('visible');
            }
        }
    }

    /**
     *  Modal
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
    , modal: function(action, params) {

        if ( ! this._modal) {
            this._modal = {
                params: null
                , name: null
                , form: null
                , button: null
            };

            for (var key in this._modal) {
                this._modal[key] = Selector.id('project-form' + ((key == 'form') ?  '' : ('-' + key)));
            }
        }

        if (action == 'close') {
            this._modal.form.className = '';
            this._modal.params.innerHTML = '';
            return;
        }

        var self = this;

        /**
         *  @param {string} title   - (Optional) Name of form
         *  @param {array} fields   - (Optional) Array with obj param
         *      @param {obj}
         *          @param {string} type    - (Optional) Field type
         *          @param {string} name    - (Optional) Field name
         *          @param {string} value   - (Optional) Field value
         *          @param {obj} file       - (Optional) Object with attributes
         *              @param {string} accept  - (Optional) Attribute
         *              @param {bool} multiple  - (Optional) Attribute
         *  @param {string} button   - (Optional) Text on buttons
         */
        function createModal(params) {
            params = params || {};
            self._modal.params.innerHTML = '';
            self._modal.name.innerHTML = params.title || '';

            (params.fields || [{}])
                .forEach(function(item) {

                    if (item.type == 'file') {

                        self._modal.params.html(
                            (self._templates.form_upload || '')
                                .replacePHs('name', (item.name || ''), true)
                                .replacePHs('type', (item.type || 'text'))
                                .replacePHs('attributes', (function() {
                                    var attributes = [];

                                    if (item.file) {
                                        if ('accept' in item.file) {
                                            attributes.push('accept="' + item.file.accept + '"');
                                        }
                                        if ('multiple' in item.file) {
                                            attributes.push('multiple="' + (item.file.multiple).toString() + '"');
                                        }
                                    }

                                    return attributes.join(' ');
                                })())
                        );

                    } else {

                        self._modal.params.html(
                            (self._templates.form_field || '')
                                .replacePHs('name', (item.name || ''), true)
                                .replacePHs('class', (item.class || ''), true)
                                .replacePHs('type', (item.type || 'text'))
                                .replacePHs('value', (item.value || ''), true)
                        );

                    }
                });

            self._modal.button.html(
                (self._templates.button || '')
                    .replacePHs('name', (params.button || ''))
                , true);

            self._modal.form.className = 'show-modal';
        }

        if (action == 'addDir') {

            createModal({
                title: 'New ' + params.type
                , fields: [
                    {
                        name: 'name of New ' + params.type
                    }
                ]
                , button: 'Add'
            });

            addEvent(this._modal.button.querySelector('div'), 'click', function() {
                var value = self._modal.params.querySelector('input').value;

                if (value) {
                    self._sendRequest(self._events.request.fs.new_dir, {
                        path: self._serialize() + '/' + value
                    });
                    self.modal('close');
                } else {
                    Toast.message('error', 'Name must be not empty');
                }
            });

        } else if (action == 'remove') {

            createModal({
                title: 'Remove'
                , fields: [
                    {
                        name: 'Are you sure, that you want to delete path ' + self._serialize()
                        , class: 'hidden'
                    }
                ]
                , button: 'Remove'
            });

            addEvent(this._modal.button.querySelector('div'), 'click', function() {
                self._sendRequest(self._events.request.fs.remove, {
                    path: self._serialize()
                });
            });

        } else if (action == 'rename') {

            createModal({
                title: 'Change name'
                , fields: [
                    {
                        name: 'New name:'
                        , value: params.value
                    }
                ]
                , button: 'Change'
            });

            addEvent(this._modal.button.querySelector('div'), 'click', function() {
                var value = self._modal.params.querySelector('input').value;

                if (value) {
                    var obj = {
                        oldPath: [
                            ''
                            , params.value
                        ]
                        , newPath: [
                            ''
                            , value
                        ]
                    };

                    if ('project' in self._url) {
                        Object.keys(obj)
                            .forEach(function(key) {
                                obj[key].splice(1, 0, self._url['project']);
                            });
                    }

                    Object.keys(obj)
                        .forEach(function(key) {
                            obj[key] = obj[key].join('/');
                        });

                    self._sendRequest(self._events.request.fs.move, obj);
                    self.modal('close');
                } else {
                    Toast.message('error', 'Name must be not empty');
                }
            });

        } else if (action == 'addJob') {

            createModal({
                title: 'New ' + params.type
                , fields: [
                    {
                        name: 'name of New ' + params.type
                    }
                ]
                , button: 'Add ' + params.type
            });

            addEvent(this._modal.button.querySelector('div'), 'click', function() {
                var value = self._modal.params.querySelector('input').value;

                if (value) {
                    self._sendRequest(self._events.request.fs.new_dir, {
                        path: self._serialize() + '/' + value
                    });
                    self.modal('close');
                } else {
                    Toast.message('error', 'Name must be not empty');
                }
            });

        } else if (action == 'startJob') {

            var fields = JSON.parse(decodeURIComponent(Cookie.get('param_start_job') || '%5B%5D'));

            createModal({
                title: 'Set params'
                , fields: fields
                , button: 'Start'
            });

            addEvent(this._modal.button.querySelector('div'), 'click', function() {
                Selector.queryAll('#project-form-params input')
                    .forEach(function(input, key) {
                        fields[key].value = input.value.trim();
                    });

                // Cookie.set('param_start_job', encodeURIComponent(JSON.stringify(fields || [])));

                self._sendRequest(self._events.request.cis.job_run, {
                    project: self._url.project,
                    job: self._url.job,
                    params: fields
                });
                self.modal('close');
            });

        } else if (action == 'addFile') {

            createModal((function() {
                var obj = {
                    title: 'Upload ' + params.name + '(-s)'
                    , fields: [
                        {
                            type: 'file'
                            , file: {
                                multiple: true
                            }
                            , name: 'Select ' + params.name + '(-s)'
                        }
                    ]
                    , button: 'Upload'
                };

                if (params.accept) {
                    obj.fields[0].file.accept = params.accept;
                }

                return obj;
            })());

            function disableButton(param) {
                if (param) {
                    self._modal.button.querySelector('div').setAttribute('data-disabled', 'disabled');
                } else {
                    self._modal.button.querySelector('div').setAttribute('data-disabled', '');
                }
            }

            addEvent(this._modal.params.querySelector('input[type="file"]'), 'change', function() {
                if ( ! this.files.length) {
                    disableButton(true);
                    return;
                }

                Selector.id('project-form-upload').innerHTML = '';

                [].slice.call(this.files)
                    .forEach(function(file, key) {
                        if ( ! key) {
                            Selector.id('project-form-upload').html(
                                (self._templates.form_upload_item || '')
                                    .replacePHs('name', 'Name')
                                    .replacePHs('type', 'Type')
                                    .replacePHs('size', 'Size')
                            );
                        }
                        Selector.id('project-form-upload').html(
                            (self._templates.form_upload_item || '')
                                .replacePHs('name', file.name)
                                .replacePHs('type', (file.type || '-'))
                                .replacePHs('size', fileSize(file.size))
                        );
                    });

                disableButton(false);
            });

            disableButton(true);

            addEvent(this._modal.button.querySelector('div'), 'click', function() {
                if (this.getAttribute('data-disabled') == 'disabled') {
                    Toast.message('warning', 'Select file(-s) first please');
                    return;
                }

                AJAX({
                    url: '/upload' + self._serialize()
                    , method: 'POST'
                    , data: {
                        files: self._modal.params.querySelector('input[type="file"]').files
                    }
                    , events: {
                        wait: function() {
                            html.addClass('wait');
                        }
                        , success: function() {
                            Toast.message('success', 'File(-s) added success');
                            setTimeout(function() {
                                location.reload();
                            }, 2 * 1000);
                        }
                        , error: function(text, xhr) {
                            Toast.message('error', 'File(-s) added error');
                            html.removeClass('wait');
                        }
                    }
                });

                self.modal('close');
            });

        }




        // } else if (action == 'download') {

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

        // }
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

            var other_attributes = [];
            if ((params.input || {}).file) {

                if (params.input.file.accept) {
                    other_attributes.push('accept="' + params.input.file.accept + '"');
                }
                if (params.input.file.multiple) {
                    other_attributes.push('multiple=true');
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
                            .replacePHs('other_attributes', other_attributes.join(' '))
                    );
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

                        if ( ! item.value.trim()) {
                            is_correct = false;
                            Toast.message('warning', 'Please enter a value');
                        }
                    });
            }

            if ( ! (params || {}).is_encode) {

                values
                    .forEach(function(item) {

                        if (item.value != item.value.encode()) {
                            is_correct = false;
                            Toast.message('warning', 'Please, enter value without \' \" & < >');
                        }
                    });
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

    , _serialize: function(params) {
        var self = this;

        // get the path of the form '/<project.name>/<job.name>/..'
        return '/' + Object.keys(params || this._url)
            .map(function(item) {
                return self._url[item];
            }).join('/');
    }
};

addEventListener("popstate",function(e) {
    // if (window.location.href.indexOf('download') == -1) {
        Project.send();
    // }
});