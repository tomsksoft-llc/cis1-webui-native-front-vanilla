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
                , build_log_error:      'cis.session.not_established'

                // success
                , project_list:     'cis.project_list.get.success'
                , project_add:      'cis.project.add.success'
                , project_remove:   'cis.project.remove.success'
                , job_list:         'cis.project.info.success'
                , job_add:          'cis.job.add.success'
                , job_remove:       'cis.job.remove.success'
                , build_list:       'cis.job.info.success'
                , build_run:        'cis.job.run.success'
                , build_remove:     'cis.build.remove.success'
                , entry_list:       'cis.build.info.success'

                // process
                , build_log_entry:  'cis.session.log_entry'
                , build_log_closed: 'cis.session.closed'
            }
            , fs: {
                // errors
                invalid_path:   'fs.entry.error.invalid_path'
                , doesnt_exist: 'fs.entry.error.doesnt_exist'
                , error_dir:    'fs.entry.error.cant_create_dir'
                , move_cant:    'fs.entry.error.cant_move'

                // successes
                , list:     'fs.entry.list.success'
                , info:     'fs.entry.info.success'
                , refresh:  'fs.entry.refresh.success'
                , new_dir:  'fs.entry.new_dir.success'
                , remove:   'fs.entry.remove.success'
                , move:     'fs.entry.move.success'
                , executable: 'fs.entry.set_executable_flag.success'
            }
        }
        , request: {
            cis: {
                project_list:       'cis.project_list.get'
                , project_add:      'cis.project.add'
                , project_remove:   'cis.project.remove'
                , job_list:         'cis.project.info'
                , job_add:          'cis.job.add'
                , job_remove:       'cis.job.remove'
                , build_list:       'cis.job.info'
                , build_run:        'cis.job.run'
                , build_remove:     'cis.build.remove'
                , build_subscribe:  'cis.session.subscribe'
                , build_unsubscribe: 'cis.session.unsubscribe'
                , entry_list:       'cis.build.info'
            }
            , fs: {
                list:       'fs.entry.list'
                , info:     'fs.entry.info'
                , refresh:  'fs.entry.refresh'
                , new_dir:  'fs.entry.new_dir'
                , remove:   'fs.entry.remove'
                , move:     'fs.entry.move'
                , executable: 'fs.entry.set_executable_flag'
            }
        }
    }
    , _data: {}
    , _templates: {}
    , _param_start_job: []

    , _params: {}
    , _action: null

    , _messages: [
        'cis'
        , 'fs'
    ]

    , _last_file_content: ''
    , _last_session_id: ''

    , init: function(params) {

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
        
        if (typeof params == 'object') {
            this._params = params;
        } else {
            this._params = {
                type: 'all'
            };
        }
        this._elements.project.setAttribute('data-type', this._params.type);

        this.send();
    }

    , send: function() {

        var self = this;

        this._url = Hash.get({}, true);

        // // begin custom
        // var res = JSON.parse(JSON.stringify(this._url));
        // res.action = JSON.stringify({
        //     name: 'startJob'
        //     , params: [
        //         {
        //             name: 'name_1'
        //             , value: 'a'
        //         }
        //         , {
        //             name: 'name_2'
        //             , value: ' a s'
        //         }
        //         , {
        //             name: 'name_3'
        //             , value: 'ascas f asf '
        //         }
        //     ]
        // });
        // Hash.set(res);
        //
        // this._url = Hash.get({}, true);
        // // end custom

        if (this._url.action) {
            try {
                this._action = JSON.parse(this._url.action);
            } catch(e) {}
            delete this._url.action;
            Hash.set(this._url);
        }

        if (this._url.file) {

            this._sendRequest(this._events.request.fs.info);

        } else if (this._url.path) {

            this._sendRequest(this._events.request.fs.list);

        } else if (this._url.project &&
                this._url.job &&
                this._url.build) {

            this._sendRequest(this._events.request.cis.entry_list);

        } else if (this._url.project &&
                this._url.job &&
                this._url.name) {

            this.onmessage({event: this._events.response.cis.property});

        } else if (this._url.project &&
                this._url.job) {

            this._sendRequest(this._events.request.cis.build_list);

        } else if (this._url.project) {

            this._sendRequest(this._events.request.cis.job_list);

        } else {

            this._sendRequest(this._events.request.cis.project_list);

        }

        Selector.query('title').innerHTML = 'CIS: ' + (self._url.serialize()
                    .split('&')
                    .map(function(item) {
                        return item.capitalize();
                    })
                    .join(' > ') || 'root');
    }

    , onmessage: function(message) {

        var self = this;

        this._data = message.data || {};

        function showButtons(buttons, properties) {

            buttons = buttons || [];
            properties = properties || [];

            self._elements.buttons.innerHTML = '';
            self._elements.info.innerHTML = '';

            self._elements.path.html(
                (self._templates.path || '')
                    .replacePHs('title', 'root')
                    .replacePHs('url', '')
                    .replacePHs('part', 'root'), true);

            buttons
                .forEach(function(item) {

                    self._elements.buttons.html(
                        (self._templates.button || '')
                            .replacePHs('onclick', item.onclick, true)
                            .replacePHs('name', item.name));
                });

            properties
                .forEach(function(item) {

                    self._elements.buttons.html(
                        (self._templates.property || '')
                            .replacePHs('onclick', (function() {

                                if (item.onclick) {
                                    return item.onclick;
                                }

                                var type = (item.metainfo || {}).type;
                                var obj = JSON.parse(JSON.stringify(self._url));

                                if (type == 'file') {
                                    obj[type] = item.name;
                                    return 'window.location.hash = \'#' + obj.serialize() + '\';';
                                }

                                return '';
                            })(), true)
                            .replacePHs('name', item.name));
                });

            var url = {};
            for (var key in self._url) {

                url[key] = self._url[key];

                if (self._url[key].indexOf('/') > -1) {

                    var arr = [];

                    self._url[key].split('/')
                        .forEach(function(part) {
                            arr.push(part);
                            url[key] = arr.join('/');

                            self._elements.path.html(
                                (self._templates.path || '')
                                    .replacePHs('title', key)
                                    .replacePHs('url', url.serialize())
                                    .replacePHs('part', part)
                            );
                        });

                } else {

                    self._elements.path.html(
                        (self._templates.path || '')
                            .replacePHs('title', key)
                            .replacePHs('url', url.serialize())
                            .replacePHs('part', url[key])
                    );
                }

                self._elements.info.html(
                    (self._templates.info || '')
                        .replacePHs('key', key.capitalize())
                        .replacePHs('value', url[key])
                );
            }
        }

        function createTable(message) {

            self._elements.title.className = '';
            self._elements.table.innerHTML = '';

            if (self._url.file) {

                showButtons(buttons.file);

                if ( ! message.data) {
                    Toast.message('error', 'Server error. Try again later.');
                    return;
                }

                self._elements.table.html(
                    (self._templates.file || '')
                        .replacePHs('executable', (((message.data || {}).metainfo || {}).executable ? 'checked' : ''))
                );

                setTimeout(function() {
                    self._last_file_content = '';

                    var textarea = Selector.id('file-content');
                    var executable_checkbox = Selector.id('file-executable');
                    var file_save = Selector.query('#project-table > div.file-row > div.file-cell > .custom-button');

                    AJAX({
                        url: message.data.link
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

                    addEvent(executable_checkbox, 'change', function() {
                        self._sendRequest(self._events.request.fs.executable, {
                            path: message.data.path
                            , executable: !!this.checked
                        });
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
                                    file: (function() {
                                        var file = null;
                                        try {
                                            file = new File([new Blob([textarea.value])], self._url.file);
                                        } catch(e) {
                                            file = new Blob([textarea.value], { type: '' });
                                            file.lastModifiedDate = (new Date()).getTime();
                                            file.name = self._url.file;
                                        }
                                        return file;
                                    })()
                                }
                            }
                            , events: {
                                wait: function() {
                                    html.addClass('wait');
                                }
                                , success: function() {
                                    self._last_file_content = textarea.value;
                                    file_save.setAttribute('data-disabled', 'disabled');
                                    Toast.message('success', 'File saved');
                                    html.removeClass('wait');
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

                return false;
            }

            var url = JSON.stringify(self._url);

            ((message.data || {}).fs_entries || [])
                .forEach(function(item) {
                    self._elements.table.html((function() {

                        var type = (item.metainfo || {}).type || '';
                        var template = self._templates.list || '';
                        var obj = JSON.parse(url);

                        if ( ! [
                                'project'
                                , 'job'
                                , 'build'
                                , 'directory'
                                , 'file'
                            ].inArray(type)) {
                            return '';
                        }

                        if (type == 'directory') {

                            if ( ! obj['path']) {
                                obj['path'] = '';
                            }
                            obj['path'] = obj['path']
                                .split('/')
                                .filter(function(part) {
                                    return part;
                                });
                            obj['path'].push('%%item_name%%');
                            obj['path'] = obj['path'].join('/');

                        } else {

                            if (type == 'build') {
                                template = self._templates.build || '';
                            }
                            obj[type] = '%%item_name%%';

                        }

                        return template
                            .replacePHs('title', type, true)
                            .replacePHs('executable', ((item.metainfo || {}).executable || 'false'))
                            .replacePHs('rename_event', ("Project.modal('rename', { value: '%%item_name%%' })"), true)
                            .replacePHs('url', ('#' + obj.serialize()
                                .replaceAll(encodeURIComponent('%%item_name%%'), '%%item_name%%')))
                            .replacePHs('item_name', (item.name || ''), true)
                            .replacePHs('link', (item.link || ''), true)
                            .replacePHs('date', ('Start date: ' + (item.metainfo || {}).date));
                    })());
                });

            return true;
        }

        var buttons = {
            all: {
                root: [
                    {
                        name: 'New project'
                        , onclick: "Project.modal('addDir', {type: 'project'});"
                    }
                    , {
                        name: 'New dir'
                        , onclick: "Project.modal('addDir', {type: 'directory'});"
                    }
                    , {
                        name: 'Add file(-s)'
                        , onclick: "Project.modal('addFile', {name: 'file'});"
                    }
                ]
                , project: [
                    {
                        name: 'New job'
                        , onclick: "Project.modal('addDir', {type: 'job'});"
                    }
                    , {
                        name: 'Remove project'
                        , onclick: "Project.modal('removeDir', {type: 'project'});"
                    }
                    , {
                        name: 'New dir'
                        , onclick: "Project.modal('addDir', {type: 'directory'});"
                    }
                    , {
                        name: 'Add file(-s)'
                        , onclick: "Project.modal('addFile', {name: 'file'});"
                    }
                ]
                , job: [
                    {
                        name: 'Start job'
                        , onclick: "Project.modal('startJob');"
                    }
                    , {
                        name: 'Remove job'
                        , onclick: "Project.modal('removeDir', {type: 'job'});"
                    }
                    , {
                        name: 'New dir'
                        , onclick: "Project.modal('addDir', {type: 'directory'});"
                    }
                    , {
                        name: 'Add file(-s)'
                        , onclick: "Project.modal('addFile', {name: 'file'});"
                    }
                ]
                , build: [
                    {
                        name: 'Remove build'
                        , onclick: "Project.modal('removeDir', {type: 'build'});"
                    }
                    , {
                        name: 'New dir'
                        , onclick: "Project.modal('addDir', {type: 'directory'});"
                    }
                    , {
                        name: 'Add file(-s)'
                        , onclick: "Project.modal('addFile', {name: 'file'});"
                    }
                    // , {
                    //     name: 'Add params'
                    //     , onclick: "Project.modal('addFile', {name: 'params', accept: '.params'});"
                    // }
                    // , {
                    //     name: 'Add readme'
                    //     , onclick: "Project.modal('addFile', {name: 'readme', accept: '.md, .txt'});"
                    // }
                ]
                , directory: [
                    {
                        name: 'Remove directory'
                        , onclick: "Project.modal('removeDir', {type: 'directory'});"
                    }
                    , {
                        name: 'New dir'
                        , onclick: "Project.modal('addDir', {type: 'directory'});"
                    }
                    , {
                        name: 'Add file(-s)'
                        , onclick: "Project.modal('addFile', {name: 'file'});"
                    }
                ]
                , file: [
                    {
                        name: 'Replace content'
                        , onclick: "Project.actionButton('file', 'replace');"
                    }
                    , {
                        name: 'Download'
                        , onclick: "Project.actionButton('file', 'download');"
                    }
                    , {
                        name: 'Remove'
                        , onclick: "Project.modal('removeDir', {type: 'file'});"
                    }
                ]
            }
            , custom: {
                job: [
                    {
                        name: 'Start job'
                        , onclick: "Project.modal('startJob');"
                    }
                ]
            }
        };

        buttons = buttons[this._params.type] || {};

        // cis. ...
        if ( ! message.event.indexOf('cis.')) {

            // cis.project.error.doesnt_exist
            // cis.job.error.doesnt_exist
            // cis.job.error.invalid_params
            // cis.build.error.doesnt_exist
            // cis.session.not_established
            if ([
                    this._events.response.cis.project_doesnt_exist
                    , this._events.response.cis.job_doesnt_exist
                    , this._events.response.cis.job_invalid_params
                    , this._events.response.cis.build_doesnt_exist
                    , this._events.response.cis.build_log_error
                ].inArray(message.event)) {

                // cis.project.error.doesnt_exist
                if (message.event == this._events.response.cis.project_doesnt_exist) {

                    showButtons(buttons.project);

                // cis.job.error.doesnt_exist
                } else if (message.event == this._events.response.cis.job_doesnt_exist) {

                    showButtons(buttons.build);

                // cis.build.error.doesnt_exist
                } else if (message.event == this._events.response.cis.build_doesnt_exist) {

                    showButtons(buttons.job);

                // cis.session.not_established
                } else if (message.event == this._events.response.cis.build_log_error) {

                    this.modal('close', { type: 'log' });

                }

                if (message.errorMessage) {
                    Toast.message('error', message.errorMessage);
                }

            // cis.project_list.get.success
            } else if (message.event == this._events.response.cis.project_list) {

                showButtons(buttons.root);
                if (createTable(message)) {
                    this._elements.title.className = 'show';
                }

            // cis.project.add.success
            } else if (message.event == this._events.response.cis.project_add) {

                this.send();

            // cis.project.remove.success
            } else if (message.event == this._events.response.cis.project_remove) {

                this._backToPath();

            // cis.project.info.success
            } else if (message.event == this._events.response.cis.job_list) {

                showButtons(buttons.project);
                createTable(message);

            // cis.job.add.success
            } else if (message.event == this._events.response.cis.job_add) {

                this.send();

            // cis.job.remove.success
            } else if (message.event == this._events.response.cis.job_remove) {

                this._backToPath();

            // cis.job.info.success
            } else if (message.event == this._events.response.cis.build_list) {

                showButtons(buttons.job, (message.data || {}).properties);
                if (createTable(message)) {
                    if ((this._action || {}).name == 'startJob') {
                        this._param_start_job = this._action.params;
                        this.modal('startJob');
                    } else {
                        this._param_start_job = ((message.data || {}).params || []);
                    }
                }

            // cis.job.run.success
            } else if (message.event == this._events.response.cis.build_run) {

                Toast.message('info', 'Job run success');
                this.showLog(message.data.session_id);
                this.send();

            // cis.session.log_entry
            } else if (message.event == this._events.response.cis.build_log_entry) {

                this.modal('log', message.data);

            // cis.session.closed
            } else if (message.event == this._events.response.cis.build_log_closed) {

                if (this._last_session_id = message.data.session_id &&
                        this._modal.form.getAttribute('data-type') == 'log') {
                    Toast.message('info', 'Log ended');
                }

            // cis.build.remove.success
            } else if (message.event == this._events.response.cis.build_remove) {

                this._backToPath();

            // cis.build.info.success
            } else if (message.event == this._events.response.cis.entry_list) {

                if (createTable(message)) {

                    showButtons(buttons.build, [
                        {
                            onclick: 'Project.showLog("' + message.data.session_id + '");'
                            , name: 'Run log'
                        }
                    ]);

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
                }
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

                showButtons(buttons.directory);
                createTable(message);

            // fs.entry.info.success
            } else if (message.event == this._events.response.fs.info) {

                showButtons(buttons.directory);
                createTable(message);

            // fs.entry.refresh.success
            } else if (message.event == this._events.response.fs.refresh) {

                this.send();

            // fs.entry.new_dir.success
            } else if (message.event == this._events.response.fs.new_dir) {

                Toast.message('info', 'Create success');
                this.send();

            // fs.entry.remove.success
            } else if (message.event == this._events.response.fs.remove) {

                this._backToPath();

            // fs.entry.move.success
            } else if (message.event == this._events.response.fs.move) {

                Hash.set(this._url);
                this.send();

            // fs.entry.executable.success
            } else if (message.event == this._events.response.fs.executable) {

                Toast.message('info', 'File executable changed success');

            }

        //unidentified message
        } else {
            console.warn('not processed message');
        }
    }

    , showLog: function(session_id) {

        this._last_session_id = session_id;

        this._sendRequest(this._events.request.cis.build_subscribe, {
            session_id: this._last_session_id
        });

    }

    /**
     *  Modal
     *
     * @param {string} action - Key to action selection
     * @param params          - (Optional)Parameter for actions
     */
    , modal: function(action, params) {

        var self = this;

        if ( ! this._modal) {
            this._modal = {
                params: null
                , name: null
                , form: null
                , button: null
            };

            Object.keys(self._modal)
                .forEach(function(item) {
                    self._modal[item] = Selector.id('project-form' + ((item == 'form') ?  '' : ('-' + item)));
                });
        }

        if (action == 'close') {
            if (params &&
                    this._modal.form.getAttribute('data-type') != params.type) {
                return;
            }

            this._modal.form.setAttribute('data-type', '');
            this._modal.form.className = '';
            this._modal.params.innerHTML = '';

            if (this._last_session_id) {
                this._sendRequest(this._events.request.build_unsubscribe, {
                    session_id: this._last_session_id
                });
                this._last_session_id = '';
            }
            return;
        }

        /**
         *  @param {string} title   - (Optional) Name of form
         *  @param {array} fields   - (Optional) Array with obj param
         *      @param {obj}
         *          @param {string} type    - (Optional) Field type
         *          @param {string} name    - (Optional) Field name
         *          @param {string} value   - (Optional) Field value
         *          @param {obj} file       - (Optional) Object with attributes
         *              @param {bool} multiple  - (Optional) Attribute
         *              @param {string} accept  - (Optional) Attribute
         *  @param {string} custom      - (Optional) Custom HTML
         *  @param {string} button      - (Optional) Text on buttons
         */
        function createModal(params) {
            params = params || {};
            self._modal.params.innerHTML = '';
            self._modal.name.innerHTML = params.title || '';
            self._modal.button.innerHTML = '';

            (params.fields || [])
                .forEach(function(item) {

                    if (item.type == 'file') {

                        self._modal.params.html(
                            (self._templates.form_upload || '')
                                .replacePHs('name', (item.name || ''))
                                .replacePHs('type', (item.type || 'text'))
                                .replacePHs('attributes', (function() {
                                    return Object.keys(item.file)
                                        .map(function(value) {
                                            return value + '="' + item.file[value].toString() + '"';
                                        }).join(' ');
                                })())
                        );

                    } else {

                        self._modal.params.html(
                            ((item.type == 'checkbox' ? self._templates.form_checkbox : self._templates.form_text) || '')
                                .replacePHs('name', (item.name || ''))
                                .replacePHs('class', (item.class || ''), true)
                                .replacePHs('type', (item.type || 'text'))
                                .replacePHs('value', (item.value || ''), true)
                                .replacePHs('text', (item.text || ''), true)
                        );

                    }
                });

            if (params.custom) {

                self._modal.params.html(params.custom);

            }

            if (params.button) {
                self._modal.button.html(
                    (self._templates.button || '')
                        .replacePHs('name', (params.button || ''))
                        .replacePHs('onclick', '')
                    );
            }

            self._modal.form.setAttribute('data-type', action);
            self._modal.form.className = 'show-modal';
        }

        if (action == 'log') {

            if (this._last_session_id != params.session_id) {
                return;
            }

            if (this._modal.form.getAttribute('data-type') != 'log') {

                createModal({
                    title: 'Run log'
                    , custom: this._templates.form_log_item
                        .replacePHs('time', 'Time')
                        .replacePHs('message', 'Messages')
                });

            }

            var result_date = (function() {
                var date = new Date(params.time);

                date = {
                    day: date.getDate()
                    , month: date.getMonth() + 1
                    , year: date.getFullYear()
                    , hours: date.getHours()
                    , minutes: date.getMinutes()
                    , seconds: date.getSeconds()
                    , miliseconds: date.getMilliseconds()
                };

                [
                    'day'
                    , 'month'
                    , 'hours'
                    , 'minutes'
                    , 'seconds'
                ].forEach(function(key) {
                    if (date[key] < 10) {
                        date[key] = '0' + date[key];
                    }
                });

                date.year = date.year.toString().slice(2);

                if (date.miliseconds < 10) {
                    date.miliseconds = '00' + date.miliseconds;
                } else if (date.miliseconds < 100) {
                    date.miliseconds = '0' + date.miliseconds;
                }

                return date;
            })();

            this._modal.params.html(this._templates.form_log_item
                .replacePHs('time', (
                    [
                        result_date.day
                        , result_date.month
                        , (
                            result_date.year +
                            ' ' +
                            [
                                result_date.hours
                                , result_date.minutes
                                , result_date.seconds
                            ].join(':')
                        )
                        , result_date.miliseconds
                    ].join('.')
                ))
                .replacePHs('message', (params.message || '...'), true)
            );

        } else if (action == 'addDir') {

            createModal({
                title: 'New ' + params.type
                , fields: [
                    {
                        name: 'name of New ' + params.type.capitalize()
                    }
                ]
                , button: 'Add ' + params.type
            });

            addEvent(this._modal.button.querySelector('div'), 'click', function() {
                var value = self._modal.params.querySelector('input').value;

                var events = {
                    directory: {
                        event: self._events.request.fs.new_dir
                        , value: {
                            path: self._serialize() + '/' + value
                        }
                    }
                    , project: {
                        event: self._events.request.cis.project_add
                        , value: {
                            project: value
                        }
                    }
                    , job: {
                        event: self._events.request.cis.job_add
                        , value: {
                            project: self._url.project
                            , job: value
                        }
                    }
                };

                if (value) {
                    self._sendRequest(events[params.type].event, events[params.type].value);
                    self.modal('close', { type: action });
                } else {
                    Toast.message('error', 'Name must be not empty');
                }
            });

        } else if (action == 'removeDir') {

            createModal({
                title: 'Remove ' + params.type
                , fields: [
                    {
                        name: 'Are you sure, that you want to delete ' + params.type.capitalize() + ':<br>' + self._serialize()
                        , class: 'hidden'
                    }
                ]
                , button: 'Remove ' + params.type
            });

            addEvent(this._modal.button.querySelector('div'), 'click', function() {

                var events = {
                    directory: self._events.request.fs.remove
                    , project: self._events.request.cis.project_remove
                    , job: self._events.request.cis.job_remove
                    , build: self._events.request.cis.build_remove
                    , file: self._events.request.fs.remove
                };

                self._sendRequest(events[params.type]);
                self.modal('close', { type: action });
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
                    self._sendRequest(self._events.request.fs.move, {
                        oldPath: self._serialize() + '/' + params.value
                        , newPath: self._serialize() + '/' + value
                    });
                    self.modal('close', { type: action });
                } else {
                    Toast.message('error', 'Name must be not empty');
                }
            });

        } else if (action == 'startJob') {

            var self = this;

            createModal({
                title: 'Set params'
                , fields: (function() {
                    var params = JSON.parse(JSON.stringify(self._param_start_job));
                    params.push({
                        type: 'checkbox'
                        , class: 'start-job-force'
                        , name: 'force'
                        , text: 'force'
                        , value: 'checked'
                    });
                    return params;
                })()
                , button: 'Start'
            });

            addEvent(this._modal.button.querySelector('div'), 'click', function() {
                Selector.queryAll('#project-form-params input[type="text"]')
                    .forEach(function(input, key) {
                        self._param_start_job[key].value = input.value.trim();
                    });

                self._sendRequest(self._events.request.cis.build_run, {
                    project: self._url.project
                    , job: self._url.job
                    , params: self._param_start_job
                    , force: !!document.getElementById('start-job-force').checked
                });

                self.modal('close', { type: action });
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
                            self.send();
                        }
                        , error: function(text, xhr) {
                            Toast.message('error', 'File(-s) added error');
                            html.removeClass('wait');
                        }
                    }
                });

                self.modal('close', { type: action });
            });

        }
    }

    , actionButton: function(type, action) {

        if (type == 'file') {

            if (action == 'replace') {

                var textarea = Selector.id('file-content');
                var file_save = Selector.query('#project-table > div.file-row > div.file-cell > .custom-button');
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

            } else if (action == 'download') {

                if (this._data.link) {
                    var link = document.createElement('a');
                    link.href = this._data.link;
                    link.target = '_blank';
                    link.click();
                }

            }

        }
    }

    , _backToPath: function() {

        var new_href = (this._elements.path.querySelector('a:nth-last-child(2)') ||
            this._elements.path.querySelector('a')).href;

        if (new_href == window.location) {
            this.send();
        } else {
            window.location = new_href;
        }

        Toast.message('info', 'remove success');
    }

    , _sendRequest: function(event, data) {

        if ( ! event) {
            return;
        }

        if ( ! event.indexOf('fs.entry') &&
             ! data) {
            data = { path: this._serialize() };
        } else {
            data = data || this._url || {};
        }

        Socket.send({
            event: event,
            transactionId: (new Date()).getTime(),
            data: data
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
    Project.send();
});