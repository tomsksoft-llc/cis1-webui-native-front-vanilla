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
        get_project_list: 'cis.project_list.get'
        , get_job_list: 'cis.project.info'
        , get_build_list: 'cis.job.info'
        , get_entry_list: 'fs.entry.list'
    }

    , _templates: {}

    , init: function () {

        this._url = Hash.get();

        for (var key in this._elements) {
            this._elements[key] = (key == 'project') ? Selector.id('project') : Selector.id('project-' + key);
        }

        var selector_name = 'template-project-';

        Selector.queryAll('script[id^="' + selector_name + '"]')
            .forEach(function (item) {
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
                .forEach(function (item) {

                    var part = item.split('=');
                    self._url[part[0]] = part[1];
                });
        }

        if (this._url.project &&
            this._url.job &&
            this._url.build) {

            this._sendRequest(this._events.get_entry_list, {path: this._getPath()});

        } else if (this._url.project &&
                    this._url.job &&
                    this._url.name) {

            this.onmessage({event: 'cis.property.info.success'});

        } else if (this._url.project &&
                    this._url.job) {

            this._sendRequest(this._events.get_build_list, this._url);

        } else if (this._url.project) {

            this._sendRequest(this._events.get_job_list, this._url);

        } else {

            this._sendRequest(this._events.get_project_list);
        }
    }

    , onmessage: function (message) {

        function changeEnvironment(button) {
            //change button, path, info

            self._elements.buttons.innerHTML = '';
            self._elements.info.innerHTML = '';
            self._elements.path.innerHTML = (self._templates.path || '')
                .replacePHs('url', '')
                .replacePHs('part_path', 'job') ;

            (button || [])
                .forEach(function (item) {
                    self._elements.buttons.html((self._templates.button || '')
                        .replacePHs('onclick', item.onclick, true)
                        .replacePHs('name', item.name, true));
                });

            var url = {};
            for (var key in self._url) {

                url[key] = self._url[key];

                self._elements.path.html((self._templates.path || '')
                    .replacePHs('url', url.serialize())
                    .replacePHs('part_path', url[key]));

                self._elements.info.html((self._templates.info || '')
                    .replacePHs('key', key.capitalize())
                    .replacePHs('value', url[key]));
            }

            self._elements.title.className = '';
            self._elements.header.className = '';
            self._elements.table.innerHTML = '';

            Hash.set(self._url);
        }
        function createTable(template, message) {

            var path = self._url.serialize();

            message.data.fs_entries
                .forEach(function (item) {

                    self._elements.table.html(template
                        .replacePHs('url', path, true)
                        .replacePHs('item_name', item.name, true)
                        .replacePHs('path_download', item.link, true));
                });
        }

        var button = {
            list: [
                {
                    name: 'New project'
                    , onclick: 'Project.actionsEntry(\'createNewFolder\',{title_form: \'project\'})'
                }
            ]
            , job: [
                {
                    name: 'New job'
                    , onclick: 'Project.actionsEntry(\'createNewFolder\',{title_form:\'job\'})'
                }
                , {
                    name: 'Remove project'
                    , onclick: 'Project.actionsEntry(\'remove\')'
                }
            ]
            , build: [
                {
                    name: 'Start'
                    , onclick: 'Project.actionsJob(\'start\')'
                }
                // , {
                //     name: 'Add file'
                //     , onclick: ''
                // }
                // , {
                //     name: 'Add params'
                //     , onclick: ''
                // }
                // , {
                //     name: 'Add readme'
                //     , onclick: ''
                // }
            ]
            , entry: []
            , property: [
                // {
                //     name: 'Save'
                //     , onclick: ''
                // }
            ]
        };
        var self = this;
        var name_message = message.event.split('.');

        //? message for create table
        if (name_message.inArray('get') ||
            name_message.inArray('info') ||
            name_message.inArray('list')) {

            if (message.event == 'cis.project_list.get.success') {

                changeEnvironment(button.list);
                createTable(this._templates.list || '', message);
                this._elements.title.className = 'project-list';

            } else if (message.event == 'cis.project.info.success') {

                changeEnvironment(button.job);
                createTable(this._templates.job || '', message);

            } else if (message.event == 'cis.job.info.success') {

                changeEnvironment(button.build);

                this._elements.table.innerHTML = '';

                var properties = [];
                var builds = [];

                message.data.fs_entries
                    .forEach(function (item) {
                        (item.directory) ? builds.push(item) : properties.push(item);
                    });

                for (var i = 0; i < [properties.length, builds.length].max(); i++) {

                    var table_row = {
                        build_name: builds[i] &&
                            builds[i].name
                        , build_data: builds[i] &&
                            builds[i].metainfo &&
                            builds[i].metainfo.date
                        , properties: properties[i] &&
                            properties[i].name
                    };

                    var colspan = {
                        name: 0
                        , date: 0
                        , prop: 0
                    };

                    if (table_row.build_name) {
                        colspan.name++;
                        if (table_row.build_data) {
                            colspan.date++;
                            if ( !table_row.properties) {
                                colspan.date++;
                            }
                        } else {
                            colspan.name++;
                            if (!table_row.properties) {
                                colspan.name++;
                            }
                        }
                    }
                    colspan.prop = colspan.length() - (colspan.name + colspan.date);

                    self._elements.table.html((self._templates.build || '')
                        .replacePHs('url', this._url.serialize())

                        .replacePHs('prop_name', table_row.properties || '')
                        .replacePHs('build_name', table_row.build_name || '')
                        .replacePHs('build_date', (table_row.build_data) ? 'Start date: ' + table_row.build_data : '')

                        .replacePHs('class_build', (table_row.build_name) ? '' : 'template-builds-td')
                        .replacePHs('class_date', (table_row.build_data) ? '' : 'template-builds-td')
                        .replacePHs('class_prop', (table_row.properties) ? '' : 'template-builds-td')

                        .replacePHs('colspan_name', colspan.name)
                        .replacePHs('colspan_date', colspan.date)
                        .replacePHs('colspan_prop', colspan.prop))
                }

                this._elements.header.className = 'project-list';
                this.actionsJob('init', message.data.params);

            } else if (message.event == 'fs.entry.list.success') {

                changeEnvironment(button.entry);
                createTable(this._templates.entry || '', message);

            } else if (message.event == 'cis.property.info.success') {

                changeEnvironment(button.property);
                this._elements.table.innerHTML = '';
            }

        //? message for error
        } else if (name_message.inArray('doesnt_exist')) {

            changeEnvironment();

            Toast.open({
                type: 'warning'
                , text: message.errorMessage
                , button_close: true
                , delay: 2
            });

        //? message for job
        } else if (name_message.inArray('job')) {

            if (message.event == 'cis.job.run.success') {
                Toast.open({
                    type: 'info'
                    , text: 'job run success'
                    , delay: 2
                });

            } else if (message.event == 'cis.job.error.invalid_params') {
                Toast.open({
                    type: 'error'
                    , text: 'error in params'
                    , delay: 2
                });
            }

        //? message for entry
        } else if (name_message.inArray('entry')) {

            var event = {
                refresh: 'fs.entry.refresh'
            };

            if (message.event == 'fs.entry.new_dir.success') {

                this._sendRequest(event.refresh, {path: this._getPath()});

            } else if (message.event == 'fs.entry.remove.success') {

                Toast.open({
                    type: 'info'
                    , text: 'remove success'
                    , delay: 2
                });
                this.sendDataServer();

            } else if (message.event == 'fs.entry.refresh.success') {

                Toast.open({
                    type: 'info'
                    , text: 'create success'
                    , delay: 2
                });
                this.sendDataServer();
            }

        //? unidentified message
        } else {
            console.warn('not processed message');
        }
    }

    /**
     * Job
     *
     * @param {string} name_function - Key to action selection
     * @param arg - parameter for further actions
     *     Variant
     *         name_function = 'init' (Initialization of values)
     *         @param {array} arg - Default values for request 'run job'
     *             @param {object} - Pair 'key-value'
     *                 @param {string} name  - name of param
     *                 @param {string} value - Default value received from server
     *
     *         name_function = 'start' (Run job)
     *         @param {bool} arg - Pointer to where the function was called
     *             Variant 'true' (function called from the block with the entered parameters) ||
     *             'false' (the function is called from the main block)
     *
     */

    , actionsJob: function(name_function, arg) {

        var event = {
            job_run: 'cis.job.run'
        };

        if (name_function == 'init') {

            var param = arg;
            Cookie.set('param_start_job', encodeURIComponent(JSON.stringify(param)));

        } else if (name_function == 'start') {

            var is_form = arg;
            var params = [];
            if (Cookie.get('param_start_job')) {
                params = JSON.parse(Cookie.get('param_start_job').decode(true));
            }

            if ( is_form || params.length == 0) {

                this._sendRequest(event.job_run, {
                    project: this._url.project,
                    job: this._url.job,
                    params: params
                });
                this.formInputData('showForm');

            } else if (params.length != 0) {

                this.formInputData('createForm',
                    {
                        title_name: 'Set params'
                        , onclick: 'Project.actionsJob(\'start\', true)'
                        , button_value: 'Start'
                        , param: params
                    });
            }
        }
    }

    /**
     *  Entry
     *
     * @param {string} name_function - Key to action selection
     * @param {obj} arg              - Parameter for further actions
     *     Variant
     *         init_function = 'createNewFolder' (Send a request to create a new file)
     *         arg - Options for adding a new folder
     *             @param {string} title_form - Title form; what will be created ('Project' || 'Job')
     *             @param {bool} is_name      - Is there a name for the new folder
     *
     *         init_function = 'remove' (Remove folder)
     *
     */

    , actionsEntry: function(name_function, arg) {

        var events = {
            new_dir : 'fs.entry.new_dir'
            , remove: 'fs.entry.remove'
        };

        if (name_function == 'createNewFolder') {
            //arg:
            // title_form
            // is_name

            // arg.is_name = 'true' then if the shape can accept parameters, that is, open and visible input
            //               'false' then if the shape can't accept parameters, that is, isn't visible input

            var name_folder = this.formInputData('getParam')[0];

            if (name_folder && name_folder != '') {

                this._url[arg.title_form] = name_folder;
                this._sendRequest(events.new_dir, {path: this._getPath()});
                this.formInputData('showForm');

            } else if (name_folder == '') {
                Toast.open({
                    type: 'warning'
                    , text: 'Please, enter a ' + arg.title_form + ' name'
                    , delay: 2
                });

            } else {

            this.formInputData('createForm',
                {
                    title_name: 'New ' + arg.title_form
                    , param: [{name: 'name of New ' + arg.title_form}]
                    , onclick: 'Project.actionsEntry(\'createNewFolder\',' +
                        '{title_form: \'' + arg.title_form + '\'})'
                    , button_value: 'Add'
                });
            }

        } else if (name_function == 'remove') {

            if (confirm('are you sure, that you want to delete file ' + this._getPath())) {

                this._sendRequest(events.remove, {path: this._getPath()});
                delete this._url[
                    Object.keys(this._url).pop()
                ];
                Hash.set(this._url);
            }
        }
    }

    /**
     * Form
     *
     * @param {string} name_function - Key to action selection
     * @param arg - parameter for form actions
     *     Variant
     *         name_function = 'createForm' (Set the name of the form, button, onclick event, default param)
     *         @param {obj} arg
     *             @param {string} title_name   - (Optional) Name of form
     *             @param {array} param         - (Optional) Array with obj param
     *                  @param {obj}
     *                      @param {string} name  - (Optional) Field name
     *                      @param {string} value - (Optional) Field value
     *             @param {string} button_value - (Optional) Text on buttons
     *             @param {string} onclick      - (Optional) Click action
     *
     *         @param name_function = 'getParam' (Get params from form)
     *             @returns {array} - Field values
     *
     *         @param name_function = 'showForm' (close form)
     */

    , formInputData: function(name_function, arg) {

        var self = this;

        var _elements = {
            params_block: null
            , form: null
            , button: null
            , name: null
        };

        for (var key in _elements) {
            _elements[key] = (key == 'form')
                ? Selector.id('project-form')
                : Selector.id('project-form-' + key.replaceAll('_','-',true))
        }

        function showForm(is_show) {

            if (is_show) {
                _elements.form.className = 'project-param';
            } else {
                _elements.form.className = '';
                _elements.params_block.innerHTML = '';
            }
        }

        if (name_function == 'createForm') {
            // arg:
            // title_name
            // param
            // onclick
            // button_value

            _elements.params_block.innerHTML = '';
            _elements.name.innerHTML = arg.title_name || '';

            (arg.param || [])
                .forEach(function (item) {
                    _elements.params_block.html((self._templates.form_params_block || '')
                        .replacePHs('param', (item.value || ''), true)
                        .replacePHs('name_param', (item.name || ''), true))
                });

            _elements.button.html((this._templates.button || '')
                    .replacePHs('onclick', (arg.onclick || ''), true)
                    .replacePHs('name', (arg.button_value || ''), true)
                , true);

            showForm(true);

        } else if (name_function == 'getParam') {

            return Selector.queryAll('#project-form-params-block > div > input')
                .map(function (item) {
                    return item.value.trim() || '';
                });

        } else  if (name_function == 'showForm') {
            showForm();
        }
    }

    , _sendRequest: function (event, data) {

        Socket.send({
            event: event || '',
            transactionId: (new Date()).getTime(),
            data: data || {}
        });
    }
    , _getPath: function () {
        // get the path of the form '/<project.name>/<job.name>/..'
        return '/' + Object.keys(this._url)
            .map(function (item) {
                return Project._url[item];
            }).join('/');
    }
};