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
 *                          'project.property' (go to properties section) ||
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

        path = path || this._url.serialize();
        this._url = this._toObj((path == 'project_list') ? '' : path);

        if (this._url.project &&
            this._url.job &&
            this._url.build) {

            this._sendReqest(this._events.get_entry_list, {path: this._getPath()});

        } else if (this._url.project &&
                   this._url.job &&
                   this._url.name) {

            this.onmessage({event: 'project.property'});

        } else if (this._url.project &&
                   this._url.job) {

            this._sendReqest(this._events.get_build_list, this._url);

        } else if (this._url.project) {

            this._sendReqest(this._events.get_job_list, this._url);

        } else {

            this._sendReqest(this._events.get_project_list, {});
        }

    }

    , onmessage: function (message) {

        var button = {
            list: [
                {
                    name: 'New project'
                    , onclick: 'Project.actionsEntry("openFormToNew","project")'
                }
            ]
            , job: [
                {
                    name: 'New job'
                    , onclick: 'Project.actionsEntry("openFormToNew", "job")'
                }
                , {
                    name: 'Remove project'
                    , onclick: 'Project.actionsEntry(\'remove\')'
                }
            ]
            , build: [
                {
                    name: 'Start'
                    , onclick: 'Project.actionsJob(\'start\', true)'
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
        Hash.set(self._url);

        function changeEnvironment(button) {

            button = button || [];
            var url = {};

            self._elements.buttons.innerHTML = '';
            self._elements.info.innerHTML = '';
            self._elements.path.innerHTML = (self._templates.path || '')
                .replace('(\'%%url%%\')', '(\'project_list\')')
                .replacePHs('url', '')
                .replacePHs('part_path', 'job') ;

            button
                .forEach(function (item) {
                    self._elements.buttons.html((self._templates.button || '')
                            .replacePHs('onclick', item.onclick, true)
                            .replacePHs('name', item.name, true));
                });

            for (var key in self._url) {

                url[key] = self._url[key];

                self._elements.path.html((self._templates.path || '')
                        .replacePHs('url', url.serialize())
                        .replacePHs('part_path', self._url[key]));


                self._elements.info.html((self._templates.info || '')
                        .replacePHs('key', key.capitalize())
                        .replacePHs('value', self._url[key]));
            }

            self._elements.title.className = '';
            self._elements.header.className = '';
            self._elements.table.innerHTML = '';
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

        if (message.event == 'cis.project_list.get.success') {

            changeEnvironment(button.list);
            createTable(this._templates.list || '', message);
            this._elements.title.className = 'project-list';

        } else if (message.event == 'cis.project.info.success') {

            changeEnvironment(button.job);
            createTable(this._templates.jobs || '', message);

        } else if (message.event == 'cis.job.info.success') {

            changeEnvironment(button.build);

            this._elements.table.innerHTML = '';

            var path = self._url.serialize();

            var properties = [];
            var builds = [];
            var table_row = [];

            message.data.fs_entries
                .forEach(function (item) {
                    (item.directory) ? builds.push(item) : properties.push(item);
                });

            for (var i = 0; i < [properties.length, builds.length].max(); i++) {

                var table_cell = {};

                table_cell.build_name = builds[i] &&
                                        builds[i].name;
                table_cell.build_data = builds[i] &&
                                        builds[i].metainfo &&
                                        builds[i].metainfo.date;
                table_cell.properties = properties[i] &&
                                        properties[i].name;

                table_row.push(table_cell);
            }

            table_row
                .forEach(function (item) {

                    var template = self._templates.builds || '';

                    if (item.build_name) {
                        template = template
                            .replacePHs('href_build', path,true)
                            .replacePHs('build_name', item.build_name, true)
                    } else {
                        template = template //??
                            .replacePHs('onclick=["A-Za-z.%_&=;<>#\\ \(\)\']{70,120}build[_a-z%]{5,15}<\/a>','>');
                    }

                    if (item.build_data) {
                        template = template
                            .replacePHs('build_date', 'Start date: ' + item.build_data, true)
                    } else {
                        template = template
                            .replacePHs('build_date','',true);
                    }

                    if (item.properties) {
                        template = template
                            .replacePHs('href_prop', path,true)
                            .replacePHs('prop_name', item.properties, true)
                    } else {
                        template = template //??
                            .replacePHs('onclick=["A-Za-z.%_&=;<>#\\ \(\)\']{70,120}prop[_a-z%]{5,15}<\/a>','>');
                    }

                    template = template.replaceAll('%%', '', true);

                    self._elements.table.html(template);
                });

            this._elements.header.className = 'project-list';
            this.actionsJob('init', message.data.params);

        } else if (message.event == 'fs.entry.list.success') {

            changeEnvironment(button.entry);
            createTable(this._templates.entry || '', message);

        } else if (message.event == 'project.property') {

            changeEnvironment(button.property);
            this._elements.table.innerHTML = '';

        } else if (message.event.indexOf('doesnt_exist') != -1) {

            changeEnvironment();

            Toast.open({
                type: 'warning'
                , text: message.errorMessage
                , button_close: true
                , delay: 2
            });

        } else if (message.event == 'cis.job.run.success' ||
            message.event == 'user.job.error.invalid_params') {

            this.actionsJob('onmessage', message);

        } else if (message.event.indexOf('fs.entry') != -1) {

            this.actionsEntry('onmessage', message);

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
     *             Variant 'true' (function called from the main block) ||
     *             'false' (the function is called from the block with the entered parameters)
     *
     *         name_function = 'onmessage' (Behavior on response from server)
     *         @param {object} arg - Text of response text of response from server
     *             @param {string} event - Success of action
     *                 Variant 'cis.job.run.success' (success job run) ||
     *                 'user.job.error.invalid_params' (invalid parameters specified at startup of job)
     */

    , actionsJob: function(name_function, arg) {

        var event = {
            job_run: 'cis.job.run'
        };

        if (name_function == 'init') {

            var obj = {};
            arg
                .forEach(function (item) {
                   obj[item.name] = item.value;
                });

            Cookie.set('param_start_job', encodeURIComponent(obj.serialize()));

        } else if (name_function == 'start') {

            var params = decodeURIComponent(Cookie.get('param_start_job'))
                .split('&')
                .map(function (item) {

                    var part_param = item.split('=');
                    return {
                        name: decodeURIComponent(part_param[0])
                        , value: decodeURIComponent(part_param[1])
                    };
                }) || [];

            if (!arg || Cookie.get('param_start_job').length == 0) {

                this._sendReqest(event.job_run, {
                    project: this._url.project,
                    job: this._url.job,
                    params: params
                });

                this.formInputData('changeForm');

            } else if (params.length != 0) {

                this.formInputData('createParam', {param: params});
                this.formInputData('setTitleAndButton',
                    {
                        title_name: 'Set params'
                        , onclick: 'onclick=Project.actionsJob(\'start\')'
                        , button_value: 'Start'
                    });
                this.formInputData('changeForm', true);
            }

        } else if (name_function == 'onmessage') {

                if (arg.event == 'cis.job.run.success') {
                    Toast.open({
                        type: 'info'
                        , text: 'job run success'
                        , delay: 2
                    });

                } else if (arg.event == 'user.job.error.invalid_params') {
                    Toast.open({
                        type: 'error'
                        , text: 'error in params'
                        , delay: 2
                    });
                }
            }
    }

    /**
     *  Entry
     *
     * @param {string} name_function - Key to action selection
     * @param arg - parameter for further actions
     *     Variant
     *         name_function = 'openFormToNew' (Create and open form to new folder)
     *         @param {string} arg - Title form; what will be created ('Project' || 'Job')
     *
     *         init_function = 'createNewFolder' (Send a request to create a new file)
     *         @param {string} arg - Title form; what will be created ('Project' || 'Job')
     *
     *         init_function = 'remove' (Remove folder)
     *
     *         init_function = 'onmessage' (Behavior on response from server)
     *         @param {object} arg - Text of response text of response from server
     *             @param {string} event - Success of action
     *                 Variant 'fs.entry.new_dir.success' (success create new dir) ||
     *                 'fs.entry.refresh.success' (success refresh new entry) ||
     *                 'fs.entry.remove.success'(success remove folder)
     */

    , actionsEntry: function(name_function, arg) {

        var events = {
            new_dir : 'fs.entry.new_dir'
            , remove: 'fs.entry.remove'
            , refresh: 'fs.entry.refresh'
        };

        if (name_function == 'openFormToNew') {

            var title_form = arg;

            this.formInputData('createParam',
                {
                    param: [
                        {
                            name: 'name of New ' + title_form
                        }
                    ]
                    , replace: true
                });

            this.formInputData('setTitleAndButton',
                {
                    title_name: 'New ' + title_form
                    , onclick: 'onclick=Project.actionsEntry(\'createNewFolder\',\'' + title_form + '\')'
                    , button_value: 'Add'
            });
            this.formInputData('changeForm', true);

        } else if (name_function == 'createNewFolder') {

            var title_form = arg;
            
            this._url[title_form] = this.formInputData('getParam')[0];
            this._sendReqest(events.new_dir, {path: this._getPath()});
            this.formInputData('changeForm'); 

        } else if (name_function == 'remove') {

            if (confirm('are you sure you want to delete the file ' + this._getPath())) {

                this._sendReqest(events.remove, {path: this._getPath()});
                
                delete this._url[Object.keys(this._url).pop()];
                Hash.set(this._url);
            }

        } else if (name_function == 'onmessage') {

            var message = arg;

            if (message.event == 'fs.entry.new_dir.success') {

                this._sendReqest(events.refresh, {path: this._getPath()});

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
        }
    }

    /**
     * form
     *
     * @param {string} name_function - Key to action selection
     * @param arg - parameter for further actions
     *     Variant
     *         name_function = 'setTitleAndButton' (Set the name of the form, button and onclick event)
     *         @param {obj} arg
     *             @param {string} title_name   - (Optional) Name of form
     *             @param {string} onclick      - (Optional) Click action
     *             @param {string} button_value - (Optional) Text on buttons
     *
     *         @param name_function = 'createParam' (Create a block with fields to fill)
     *         @param {obj} arg
     *             @param {array} param - (Optional) Array with obj param
     *                  @param {obj}
     *                      @param {string} name  - (Optional) Field name
     *                      @param {string} value - (Optional) Field value
     *             @param {bool} replace - (Optional) Replace param or add new param
     *
     *         @param name_function = 'getParam' (Get params from form)
     *             @returns {array} - Field values
     *
     *         @param name_function = 'changeForm' (Change display form)
     *         @param {obj} arg - is form show
     *
     */

    , formInputData: function(name_function, arg) {

        var self = this;

        _elements = {
            params_block: null
            , external_input: null
            , button: null
            , name: null
        };
        _templates = {};
    
        function setElements(elements) {
            for (var key in elements) {
                elements[key] =
                    Selector.id('project-form-' + key.replaceAll('_','-',true))
            }
        }

        function setTemplates(template) {
            var selector_name = 'template-project-form-';

            Selector.queryAll('script[id^="' + selector_name + '"]')
                .forEach(function (item) {
                    template[item.id
                        .replaceAll(selector_name,'')
                        .replaceAll('-','_')
                        ] = item.innerHTML.trim();
                });
            template.button = self._templates.button || '';
        }

        if (name_function == 'setTitleAndButton') {
            // title_name
            // onclick
            // button_value

            setTemplates(_templates);
            setElements(_elements);

            _elements.name.innerHTML = arg.title_name || '';

            _elements.button.html((_templates.button || '')
                    .replacePHs('onclick', (arg.onclick || ''), true)
                    .replacePHs('name', (arg.button_value || ''), true)
                , true);

        } else if (name_function == 'createParam'){
            //param
            //replace

            setTemplates(_templates);
            setElements(_elements);

            Selector.id('project-form-params-block').innerHTML = '';

            if (arg.replace) {
                _elements.params_block.innerHTML = '';
            }

            (arg.param || [])
                .forEach(function (item) {
                    _elements.params_block.html((_templates.params_block || '')
                        .replacePHs('name_param', (item.name || ''), true)
                        .replacePHs('param', (item.value || ''), true));
                });


        } else if (name_function == 'getParam') {
            return Selector.queryAll('#project-form-params-block > div > input')
                .map(function (item) {
                    return item.value;
                });

        } else if (name_function == 'changeForm') {
            //is_param

            setElements(_elements);
            _elements.external_input.className = (arg) ? 'project-param' : '';
        }
    }

    , _sendReqest: function (event, data) {

        Socket.send({
            event: event,
            transactionId: (new Date()).getTime(),
            data: data
        });
    }

    , _getPath: function () {
        return '/' + Object.keys(this._url)
            .map(function (item) {
                return Project._url[item];
            }).join('/');
    }

    , _toObj: function(string, isEmptyValues){

        var obj = {};
        string.split('&')
            .forEach(function (item) {

                var part_string = item.split('=');
                if (part_string[0] && part_string[1] || isEmptyValues) {
                    obj[part_string[0]] = part_string[1];
                }
            });
        return obj;
    }

};