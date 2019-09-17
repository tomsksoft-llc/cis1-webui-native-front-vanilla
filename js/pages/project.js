/**
 * Project, job, file-system
 *
 * @param {object} projectMethod - Methods that are used when clicking buttons of project
 * @param {object} jobMethod     - Methods that are used when clicking buttons of job
 * @param {object} buildMethod   - Methods that are used when clicking buttons of build
 * @param {object} entryMethod   - Methods that are used when clicking buttons of entry
 * @param {object} formMethod    - Methods that are used to work with the data filling form
 *
 * @param {object} getList       - Methods that are used to move from one table to another
 *     setPath         - Selects a table to build
 *         @param {obj || string} path - Parameter containing url
 *                                       Variant line of the form 'project=v1&job=v2...' ||
 *                                       object of the form {project: v1, job: v2...}
 *
 ​*     getProjectList  - Get list of project
 *
 *     getJobList      - Get list of jobs
 *         @param {string} project     - Name of project that owns the jobs
 *
 *     getBuildList    - Get list of builds
 *         @param {string} job         - Name of job that owns the builds
 *
 *     getEntryList    - Get list of entries
 *         @param {string} build       - Name of build that owns the entry
 *
 *     getPropertyList - Get list of properties
 *         @param {string} property    - Name of property that owns the entry
 *
 * Methods:
 *  init            - Variable initialization

 *  onmessage       - Behavior on response from server
 *      @param {object} message - Text of response text of response from server
 *          @param {string} event - Success of action
 *                          Variant 'cis.project_list.get.success' (success get projects list) ||
 *                          'cis.project.info.success' (success get jobs list) ||
 *                          'cis.job.info.success' (success get builds list) ||
 *                          'fs.entry.list.success' (success get entry list) ||
 *                          'project.property' (go to properties section) ||
 *                          'cis.job.run.success' (success job run) ||
 *                          'user.job.error.invalid_params' (invalid parameters specified at startup of job)
 *
 */

var Project = {

    _url: {}
    , _elements: {
        project: null
        , path_block: null
        , info_block: null
        , menu: {
            list: null
            , jobs: null
            , builds: null
            , entry: null
            , property:null
        }
    }

    , _event: {
        project_list_get: 'cis.project_list.get'
        , job_list_get: 'cis.project.info'
        , build_list_get: 'cis.job.info'
        , entry_list_get: 'fs.entry.list'
    }

    , _templates: {
        path: null
        , main_info: null
        , list: null
        , jobs: null
        , builds: null
        , entry: null
    }

    , init: function () {

        this._url = Hash.get();

        this._elements.project = Selector.id('project');
        this._elements.path_block = Selector.id('project-path');
        this._elements.info_block = Selector.query('#project-main-info > ul');

        for (var key in this._elements.menu) {
            this._elements.menu[key] = Selector.id('project-' + key);
        }

        for (var key in this._templates) {
            this._templates[key] = Selector.query('script[id="template-project-' + key.replaceAll('_','-',true) + '"]').innerHTML.trim();
        }

        this.getList.setPath(this._url);

        this.formMethod.init();
    }

    , getList: {

        setPath: function(path) {

            path = path || {};

            if (typeof path == 'string') {

                path = JSON.parse('{"' +
                    path.replaceAll('=','":"',false)
                        .replaceAll('&', '","', false) +
                    '"}');
            }

            if (path.project &&
                path.job &&
                path.build) {

                this.getEntryList(path.build)

            } else if (path.project &&
                path.job &&
                path.name) {

                this.getPropertyList(path.name)

            } else if (path.project &&
                path.job) {

                this.getBuildList(path.job)

            } else if (path.project) {

                this.getJobList(path.project)

            } else {
                this.getProjectList();
            }

            Project._url = path;
        }

        , getProjectList: function() {

            Socket.send({
                event: Project._event.project_list_get,
                transactionId: (new Date()).getTime(),
                data: {}
            });
            addSpiner();
        }

        , getJobList: function(project) {

            Project._url.project = project;

            Socket.send({
                event: Project._event.job_list_get,
                transactionId: (new Date()).getTime(),
                data: {
                    project: Project._url.project
                }
            });
            addSpiner();
        }

        , getBuildList: function(job) {

            Project._url.job = job;

            Socket.send({
                event: Project._event.build_list_get,
                transactionId: (new Date()).getTime(),
                data: {
                    project: Project._url.project,
                    job: Project._url.job
                }
            });
            addSpiner();
        }

        , getEntryList: function(build) {

            Project._url.build = build;
            var path = '';
            for (var key in Project._url) {
                path += '/' + Project._url[key];
            }

            Socket.send({
                event: Project._event.entry_list_get,
                transactionId: (new Date()).getTime(),
                data: {
                    path: path
                }
            });
            addSpiner();
        }

        , getPropertyList: function(property) {
            Project._url.name = property;
            Project.onmessage({event: 'project.property'});
        }

    }

    , onmessage: function (message) {

        var self = this;

        function changeEnvironment() {

            self._elements.path_block.innerHTML = '<a onclick=Project.getList.setPath(); href="#">jobs</a>';
            self._elements.info_block.innerHTML = '';

            var first_part_url = true;
            var url = '';

            for (var key in self._url) {

                var template_path = Project._templates.path;
                var template_info = Project._templates.main_info;

                url += ((first_part_url) ? '' : '&') + key + '=' + self._url[key];
                first_part_url = false;

                self._elements.path_block.html( template_path
                        .replacePHs('onclick', 'onclick=Project.getList.setPath(\'' + url + '\');', true)
                        .replacePHs('url', '#' + url, true)
                        .replacePHs('part_path', self._url[key], true)
                    , false);
                self._elements.info_block.html( template_info
                    .replacePHs('key', key.capitalize(), true)
                    .replacePHs('value', self._url[key], true)
                    , false);
            }
            Hash.set(Project._url);
        }

        function createTable(elem, template, message) {

            elem.innerHTML = '';

            message.data.fs_entries
                .forEach(function (item) {

                    elem.htmlTable(
                        template
                            .replacePHs('item_name', item.name, true)
                            .replacePHs('url', window.location.hash, true)
                            .replacePHs('path_download', item.link)
                        , false);
                });
        }

        if (message.event == 'cis.project_list.get.success') {

            changeEnvironment();
            createTable(self._elements.menu.list, self._templates.list , message);
            self._elements.project.className = 'project-list';

        } else if (message.event == 'cis.project.info.success') {

            changeEnvironment();
            createTable(self._elements.menu.jobs, self._templates.jobs, message);
            self._elements.project.className = 'project-jobs';

        } else if (message.event == 'cis.job.info.success') {

            changeEnvironment();

            self._elements.menu.builds.innerHTML = '';

            var url = window.location.hash;
            var properties = [];
            var builds = [];
            var table_row = [];

            message.data.fs_entries
                .forEach(function (item) {
                    (item.directory) ? builds.push(item) : properties.push(item);
                });

            for (var i = 0; i < [properties.length, builds.length].max(); i++) {
                var table_cell = {};
                table_cell.build_name = builds[i] && builds[i].name;
                table_cell.build_data = builds[i] && builds[i].metainfo && (builds[i].metainfo.date || builds[i].metainfo.name);
                table_cell.properties = properties[i] && properties[i].name;
                table_row.push(table_cell);
            }

            table_row
                .forEach(function (item) {

                    var code = self._templates.builds;

                    if (item.build_name) {
                        code = code.replacePHs('onclick_build', 'onclick=Project.getList.getEntryList(\'%%builds_name%%\');', true)
                            .replacePHs('href_build', 'href=' + url + '&build=%%builds_name%%', true)
                            .replacePHs('builds_name', item.build_name, true)
                    } else {
                        code = code.replacePHs('onclick_build', '', true)
                            .replacePHs('builds_name', '', true)
                            .replacePHs('href', '', true);
                    }

                    if (item.build_data) {
                        code = code.replacePHs('builds_metainfo_date', item.build_data, true)
                    } else {
                        code = code.replacePHs('Start date: %%builds_metainfo_date%%' , '', true);
                    }

                    if (item.properties) {
                        code = code.replacePHs('onclick_prop', 'onclick=Project.getList.getPropertyList(\'%%properties_name%%\');', true)
                            .replacePHs('href_prop', 'href=' + url + '&name=%%properties_name%%', true)
                            .replacePHs('properties_name', item.properties, true)
                    } else {
                        code = code.replacePHs('properties_name', '', true)
                            .replacePHs('onclick_prop', '', true)
                            .replacePHs('href_prop', '', true);
                    }

                    code = code.replaceAll('%%', '', true);

                    self._elements.menu.builds.htmlTable(code, false);
                });

            self._elements.project.className = 'project-builds';

            this.jobMethod.init(message);

        } else if (message.event == 'fs.entry.list.success') {

            changeEnvironment();
            createTable(self._elements.menu.entry, self._templates.entry, message);
            self._elements.project.className = 'project-entry';

        } else if (message.event == 'project.property') {

            changeEnvironment();
            self._elements.project.className = 'project-property';

        } else if (message.event.indexOf('doesnt_exist') != -1) {

            changeEnvironment();

            Toast.open({
                type: 'info'
                , text: message.errorMessage
                , button_close: true
                , delay: 2
            });

            self._elements.project.className = '';

        } else if (message.event == 'cis.job.run.success' ||
            message.event == 'user.job.error.invalid_params') {

            Project.jobMethod.onmessage(message);

        } else if (message.event == 'fs.entry.new_dir.success'){

            Project.entryMethod.onmessage(message);

        } else {
            alert('not processed message');
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
     *  start     - Run job
     *      @param {string} key - Pointer to where the function was called
     *                          Variant 'start' (function called from the main block) ||
     *                          'params' (the function is called from the block with the entered parameters)
     *  onmessage - Behavior on response from server
     *      @param {object} message - Text of response text of response from server(
     *          @param {string} event - Success of action
     *                          Variant 'cis.job.run.success' (success job run) ||
     *                          'user.job.error.invalid_params' (invalid parameters specified at startup of job)
     *
     */

    , jobMethod: {

        params: []
        , _url: null
        , _event: {
            job_run: 'cis.job.run'
        }

        , init: function (message) {

            this.params = message.data.params;
            this._url = Hash.get();

        }

        , start: function (key) {

            self = this;

            if (key == 'params' || this.params.length == 0) {

                Socket.send({
                    event: this._event.job_run,
                    transactionId: (new Date()).getTime(),
                    data: {
                        project: this._url.project,
                        job: this._url.job,
                        params: this.params
                    }
                });

                Project.formMethod.changeForm(false);
                addSpiner();

            } else if (this.params.length !=0) {

                Project.formMethod.clear();

                this.params
                    .forEach(function (item) {
                        Project.formMethod.createParam(item.name, item.value);
                    });

                Project.formMethod.assignTitle('Set params', 'onclick=Project.jobMethod.start(\'params\');', 'Start');
                Project.formMethod.changeForm(true);
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
     *  openFormToNew   - create and open form to new folder
     *  createNewFolder - send a request to create a new file
     *
     */

    , entryMethod:{

        onmessage: function(message){
            if (message.event == 'fs.entry.new_dir.success'){
                Toast.open({
                    type: 'info'
                    , text: 'create success'
                    , delay: 2
                });

            }
        }

        , openFormToNew: function () {
            Project.formMethod.clear();
            Project.formMethod.createParam('name of New Project:', '');
            Project.formMethod.assignTitle('New Project', 'onclick=Project.entryMethod.createNewFolder();', 'Add');
            Project.formMethod.changeForm(true);
        }

        , createNewFolder: function () {
            var path = [];
            for (var key in Project._url) {
                path.push(Project._url[key]);
            }
            if (path.length != 0) {
                path = '/' + path.join('/');
            }
            path += '/' + Project.formMethod.getParam();

            Socket.send({
                event: "fs.entry.new_dir",
                transactionId: 1,
                data: {
                    path: path
                }
            });

            Project.formMethod.changeForm(false);
            addSpiner();
            }
    }

    /**
     * form
     *
     *   *  onmessage - Behavior on response from server
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

    , formMethod: {
        _elements: {
            params_block: null
            , external_input: null
            , button: null
        }
        , _templates: {
            params_block: null
            , button: null
        }

        , init: function() {
            for (var key in this._elements){
                this._elements[key] = Selector.id('project-form-' + key.replaceAll('_','-',true))
            }
            for (var key in this._templates){
                this._templates[key] = Selector.id('template-project-form-' + key.replaceAll('_','-',true)).innerHTML.trim()
            }
        }

        , assignTitle: function (title_name, onclick, button_value) {
            Selector.query('#project-form-name > div:first-child').innerHTML = title_name || '';

            this._elements.button.html(this._templates.button
                    .replacePHs('method', (onclick || ''), true)
                    .replacePHs('value', (button_value || ''), true)
                , true);

        }

        , clear: function() {
            this._elements.params_block.innerHTML = '';
        }

        , createParam: function(name, value) {

            this._elements.params_block.html(this._templates.params_block
                    .replacePHs('name_param', (name || ''), true)
                    .replacePHs('param', (value || ''), true)
                , false);
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

Element.prototype.htmlTable = function(html, replace) {
    var self = this;
    var empty_div = document.createElement('table');

    if (html) {
        if (replace) {
            this.innerHTML = '';
        }

        empty_div.innerHTML = html;

        [].slice.call(empty_div.children)
            .forEach(function(item) {
                if (isElement(item)) {
                    self.appendChild(item.cloneNode(true));
                }
            });

        return;
    }

    if (this.outerHTML) {
        return this.outerHTML;
    }

    empty_div.appendChild(this.cloneNode(true));
    var result = empty_div.innerHTML;
    return result;
};