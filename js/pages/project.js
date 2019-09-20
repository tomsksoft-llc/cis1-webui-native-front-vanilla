/**
 * Project, job, file-system
 *
 * @param {object} projectMethod - Methods that are used when clicking buttons of project
 * @param {object} jobMethod     - Methods that are used when clicking buttons of job
 * @param {object} buildMethod   - Methods that are used when clicking buttons of build
 * @param {object} entryMethod   - Methods that are used when clicking buttons of entry
 * @param {object} formInputData    - Methods that are used to work with the data filling form
 *
 * @param {object} sendDataServer       - Methods that are used to move from one table to another
 *     @param {string} path - (Optional) Parameter containing url
 *                                   Line of the form 'project=v1&job=v2...'
 *
 ​*         @param {function} getProjectList  - Get list of project
 *
 *         @param {function} getJobList      - Get list of jobs
 *             @param {string} project     - Name of project that owns the jobs
 *
 *         @param {function} getBuildList    - Get list of builds
 *             @param {string} job         - Name of job that owns the builds
 *
 *         @param {function} getEntryList    - Get list of entries
 *             @param {string} build       - Name of build that owns the entry
 *
 *         @param {function} getPropertyList - Get list of properties
 *             @param {string} property    - Name of property that owns the entry
 *
 * Methods:
 *  init            - Variable initialization
 *
 *  onmessage       - Behavior on response from server
 *      @param {object} message - Text of response text of response from server
 *          @param {string} event        - Success of action
 *                          Variant 'cis.project_list.get.success' (success get projects list) ||
 *                          'cis.project.info.success' (success get jobs list) ||
 *                          'cis.job.info.success' (success get builds list) ||
 *                          'fs.entry.list.success' (success get entry list) ||
 *                          'project.property' (go to properties section) ||
 *                          'cis.job.run.success' (success job run) ||
 *                          'user.job.error.invalid_params' (invalid parameters specified at startup of job)
 *          @param {obj} data            - Message data
 *              @param {array} fs_entries   - Array with record objects
 *                  @param {string} name    - Name of entry
 *                  @param {string} link    - URL to download
 *                  @param {bool} directory - Is this property or build
 *                  @param {obj} metainfo   - Record metadata
 *                      @param {string}(date || name) - (Optional) Start date
 *          @param {string} errorMessage - request errors
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

        Selector.queryAll('script[id^="template-project"]')
            .forEach(function (item) {
                Project._templates[item.id.slice(17).replaceAll('-','_')] = item.innerHTML.trim(); //??
            });

        this.sendDataServer(this._url.serialize());

        this.formInputData.init();  //!!
    }

    , sendDataServer: function(path) {

        path = path || '';
        this._url = {};

        path.split('&')
            .forEach(function (item) {
                var part_property = item.split('=');
                Project._url[part_property[0]] = part_property[1];
            });

        if (this._url.project &&
            this._url.job &&
            this._url.build) {

            sendRequestEntries()

        } else if (this._url.project &&
                   this._url.job &&
                   this._url.name) {

            sendRequestProperties()

        } else if (this._url.project &&
                   this._url.job) {

            sendRequestBuilds()

        } else if (this._url.project) {

            sendRequestJobs()

        } else {
            sendRequestProjects ();
        }

        function sendRequestProjects () {

            Socket.send({
                event: Project._events.get_project_list,
                transactionId: (new Date()).getTime(),
                data: {}
            });
        }

        function sendRequestJobs() {

            Socket.send({
                event: Project._events.get_job_list,
                transactionId: (new Date()).getTime(),
                data: {
                    project: Project._url.project
                }
            });
        }

        function sendRequestBuilds() {

            Socket.send({
                event: Project._events.get_build_list,
                transactionId: (new Date()).getTime(),
                data: {
                    project: Project._url.project,
                    job: Project._url.job
                }
            });
        }

        function sendRequestEntries() {

            var path = '/' + Object.keys(Project._url)
                .map(function(item) {
                    return Project._url[item];
                }).join('/');

            Socket.send({
                event: Project._events.get_entry_list,
                transactionId: (new Date()).getTime(),
                data: {
                    path: path
                }
            });
        }

        function sendRequestProperties() {
            Project.onmessage({event: 'project.property'});
        }
    }

    , onmessage: function (message) {

        var button = {
            list: [
                {
                    name: 'New project'
                    , onclick: 'Project.entryMethod.openFormToNew(\'project\')'
                }
            ]
            , job: [
                {
                    name: 'New job'
                    , onclick: 'Project.entryMethod.openFormToNew(\'job\')'
                }
                , {
                    name: 'Remove project'
                    , onclick: 'Project.entryMethod.remove()'
                }
            ]
            , build: [
                {
                    name: 'Start'
                    , onclick: 'Project.jobMethod.start(true)'
                }
                , {
                    name: 'Add file'
                    , onclick: ''
                }
                , {
                    name: 'Add params'
                    , onclick: ''
                }
                , {
                    name: 'Add readme'
                    , onclick: ''
                }
            ]
                , entry: []
                , property: [
                {
                    name: 'Save'
                    , onclick: ''
                }
            ]
        };

        var self = this;
        self._url = Hash.get();

        function changeEnvironment(button) {

            button = button || [];
            var url = {};

            self._elements.buttons.innerHTML = '';
            self._elements.info.innerHTML = '';
            self._elements.path.innerHTML = (self._templates.path || '')
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
        }

        function createTable(template, message) {

            self._elements.table.innerHTML = '';

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
            createTable(self._templates.list || '', message);
            self._elements.title.className = 'project-list';

        } else if (message.event == 'cis.project.info.success') {

            changeEnvironment(button.job);
            createTable(self._templates.jobs || '', message);

        } else if (message.event == 'cis.job.info.success') {

            changeEnvironment(button.build);

            self._elements.table.innerHTML = '';

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
                                        (builds[i].metainfo.date || builds[i].metainfo.name);  //!! error in protocol
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

            self._elements.header.className = 'project-list';
            this.jobMethod.init(message); //!!

        } else if (message.event == 'fs.entry.list.success') {

            changeEnvironment(button.entry);
            createTable(self._templates.entry || '', message);

        } else if (message.event == 'project.property') {

            changeEnvironment(button.property);
            self._elements.table.innerHTML = '';

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

            self.jobMethod.onmessage(message); //??

        } else if (message.event == 'fs.entry.new_dir.success' ||
            message.event == 'fs.entry.remove.success'){

            self.entryMethod.onmessage(message); //??

        } else {
            console.warn('not processed message');
        }
    }

    /**
     * job
     *
     * @param {array} params - Default values for request 'run job'
     *     @param {object} - Pair 'key-value'
     *         @param {string} name  - name of param
     *         @param {string} value - Default value received from server
     ​*
     * Methods:
     *  init      - Initialization of values
     *      @param {object} message - Text of response text of response from server
     *          @param {obj} data - Message data
     *              @param {array} params - (Optional) Default options
     *                  @param {string} name  - (Optional) Default name
     *                  @param {string} value - (Optional) Default value
     *  start     - Run job
     *      @param {bool} key - Pointer to where the function was called
     *                          Variant 'true' (function called from the main block) ||
     *                          'false' (the function is called from the block with the entered parameters)
     *  onmessage - Behavior on response from server
     *      @param {object} message - Text of response text of response from server
     *          @param {string} event - Success of action
     *                          Variant 'cis.job.run.success' (success job run) ||
     *                          'user.job.error.invalid_params' (invalid parameters specified at startup of job)
     *
     */

    , jobMethod: {

        params: []
        , _event: {
            job_run: 'cis.job.run'
        }

        , init: function (message) {

            this.params = message.data.params;
        }

        , start: function (key) {

            self = this;

            if ( ! key || this.params.length == 0) {

                Socket.send({
                    event: this._event.job_run,
                    transactionId: (new Date()).getTime(),
                    data: {
                        project: Project._url.project,
                        job: Project._url.job,
                        params: this.params
                    }
                });

                Project.formInputData.changeForm(false);  //!!

            } else if (this.params.length != 0) {

                Project.formInputData.clear();  //!!

                this.params
                    .forEach(function (item) {
                        Project.formInputData.createParam(item.name, item.value);  //!!
                    });

                Project.formInputData.assignTitle('Set params', //!!
                    'onclick=Project.jobMethod.start();',
                    'Start');
                Project.formInputData.changeForm(true);
            }
        }

        , onmessage: function (message) {

            if (message.event == 'cis.job.run.success') {
                Toast.open({
                    type: 'info'
                    , text: 'job run success'
                    , delay: 2
                });

            } else if (message.event == 'user.job.error.invalid_params') {
                Toast.open({
                    type: 'error'
                    , text: 'error in params'
                    , delay: 2
                });
            }
        }

    }

    /**
     * entry
     ​*
     * Methods:
     *  onmessage       - Behavior on response from server
     *  @param {object} message - Text of response text of response from server(
     *      @param {string} event - Success of action
     *                          Variant 'fs.entry.new_dir.success' (success create new dir)
     *
     *  openFormToNew   - Create and open form to new folder
     *  createNewFolder - Send a request to create a new file
     *  remove -        - Remove folder
     */

    , entryMethod: {

        _events: {
            new_dir : 'fs.entry.new_dir'
            , remove: 'fs.entry.remove'
        }

        , onmessage: function(message) {

            if (message.event == 'fs.entry.new_dir.success') {
                Toast.open({
                    type: 'info'
                    , text: 'create success'
                    , delay: 2
                });

            } else if (message.event == 'fs.entry.remove.success') {
                Toast.open({
                    type: 'info'
                    , text: 'remove success'
                    , delay: 2
                });
            }
            Project.sendDataServer(Project._url.serialize());
        }

        , openFormToNew: function (title_form) {  //!!
            Project.formInputData.clear();
            Project.formInputData.createParam('name of New ' + title_form + ':', '');
            Project.formInputData.assignTitle('New ' + title_form,
                'onclick=Project.entryMethod.createNewFolder();', 'Add');
            Project.formInputData.changeForm(true);
        }

        , createNewFolder: function () {

            var path = '/' + Object.keys(Project._url)
                .map(function (item){
                    return Project._url[item];
                }).join('/') + '/' + Project.formInputData.getParam();

            Socket.send({
                event: this._events.new_dir,
                transactionId: (new Date()).getTime(),
                data: {
                    path: path
                }
            });

            Project.formInputData.changeForm();
            }

        , remove: function () {

            var path = '/' + Object.keys(Project._url)
                .map(function (item) {
                    return Project._url[item];
                }).join('/');

            delete Project._url[Object.keys(Project._url).pop()];
            Hash.set(Project._url);

            Socket.send({
                event: this._events.remove,
                transactionId: (new Date()).getTime(),
                data: {
                    path: path
                }
            });
        }
    }

    /**
     * form
     *
     * onmessage - Behavior on response from server
     *  @param {object} message - Text of response text of response from server(
     *
     * Methods:
     *  init        - Initialization of values
     *  assignTitle - Set the name of the form, button and onclick event
     *      @param {string} title_name   - (Optional) Name of form
     *      @param {string} onclick      - (Optional) Click action
     *      @param {string} button_value - (Optional) Text on buttons
     *  clear - Clear form
     *  createParam - Create a block with fields to fill
     *      @param {string} name  - (Optional) Field name
     *      @param {string} value - (Optional) Field value
     *  getParam    - Get params from form
     *      @returns {array} - Field values
     *  changeForm - Change display form
     *      @param {bool} is form show
     *
     */

    , formInputData: {
        
        _elements: {
            params_block: null
            , external_input: null
            , button: null
            , name: null
        }
        , _templates: {
            params_block: null
            , button: null
        }

        , init: function() {

            for (var key in this._elements) {
                this._elements[key] =
                    Selector.id('project-form-' + key.replaceAll('_','-',true))
            }
            this._elements.name = Selector.query('#project-form-name > div:first-child');

            this._templates.params_block = Selector.id('template-project-form-params-block').innerHTML.trim();
            this._templates.button = Project._templates.button;
        }

        , assignTitle: function (title_name, onclick, button_value) {

            this._elements.name.innerHTML = title_name || '';

            this._elements.button.html(this._templates.button
                    .replacePHs('onclick', (onclick || ''), true)
                    .replacePHs('name', (button_value || ''), true)
                , true);
        }

        , clear: function() {
            this._elements.params_block.innerHTML = '';
        }

        , createParam: function(name, value) {

            this._elements.params_block.html(this._templates.params_block
                    .replacePHs('name_param', (name || ''), true)
                    .replacePHs('param', (value || ''), true));
        }

        , getParam: function () {
            return Selector.queryAll('#project-form-params-block > div > input')
                .map(function (item) { return item.value });
        }

        , changeForm: function(is_param) {
            this._elements.external_input.className = (is_param) ? 'project-param' : '';
        }
    }
};