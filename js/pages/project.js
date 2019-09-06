var Project = {

    _url: {}
    , _elements: {
        path_block: null
        , info_block: null
        , menu: {
            list: null
            , jobs: null
            , builds: null
            , entry: null
        }
        , nav: {
            buttons: null
            , lists: null
        }
    }
    , _event: {
        project_list_get: 'cis.project_list.get'
        , job_list_get: 'cis.project.info'
        , build_list_get: 'cis.job.info'
        , entry_list_get: 'fs.entry.list'
    }

    , init: function () {

        this._url = Hash.get();

        this._elements.path_block = Selector.id('project-path');
        this._elements.info_block = Selector.query('#project-main-info > ul');

        for (var key in this._elements.menu) {
            this._elements.menu[key] = Selector.id('project-' + key);
        }

        for (var key in this._elements.nav) {
            this._elements.nav[key] = Selector.id('project-' + key);
        }

        if (this._url.project && this._url.job && this._url.build) {
            this.goInBuildList(this._url.build)
        } else if (this._url.project && this._url.job) {
            this.goInJobList(this._url.job)
        } else if (this._url.project) {
            this.goInProjectList(this._url.project)
        } else {
            this.goInList();
        }
    }

    , goInList: function () {

        Socket.send({
            event: this._event.project_list_get,
            transactionId: (new Date()).getTime(),
            data: {}
        })
    }

    , goInProjectList: function (project) {

        this._url.project = project;

        Socket.send({
            event: this._event.job_list_get,
            transactionId: (new Date()).getTime(),
            data: {
                project: this._url.project
            }
        })
    }

    , goInJobList: function (job) {

        this._url.job = job;

        Socket.send({
            event: this._event.build_list_get,
            transactionId: (new Date()).getTime(),
            data: {
                project: this._url.project,
                job: this._url.job
            }
        })
    }

    , goInBuildList: function (build) {

        this._url.build = build;

        Socket.send({
            event: this._event.entry_list_get,
            transactionId: (new Date()).getTime(),
            data: {
                path: '/' + this._url.project +
                    '/' + this._url.job +
                    '/' + this._url.build
            }
        })
    }

    , onmessage: function (message) {

        this._changeEnvironment();

        if (message.event == 'cis.project_list.get.success') {

            this._elements.menu.list.innerHTML = message.data.projects
                .reduce(function (prev, cur) {
                    return prev + '<tr><td onclick=\"Project.goInProjectList(\'' + cur.name + '\');\">' +
                        cur.name + '</td>' + '</tr>';
                }, '');

            this._changeTable('project-list');

        } else if (message.event == 'cis.project.info.success') {

            this._changeEnvironment();

            this._elements.menu.jobs.innerHTML = message.data.jobs
                .reduce(function (prev, cur) {
                    return prev + '<tr><td onclick=\"Project.goInJobList(\'' + cur.name + '\');\">' +
                        cur.name + '</td><td><span>Change name</span></td></tr>';
                }, '');

            this._changeTable('project-jobs');

        } else if (message.event == 'cis.job.info.success') {

            this._changeEnvironment();

            var properties = message.data.fs_entries
                .filter(function (item) {
                    return !item.directory;
                });
            var builds = message.data.builds;
            var code = '';

            for (var i = 0; i < [properties.length, builds.length].max(); i++) {
                code += '<tr>';
                if (builds[i] && builds[i].name) {
                    code += '<td onclick=\"Project.goInBuildList(\'' + builds[i].name + '\');\">' +
                        builds[i].name + '</td><td>Start date: ' + builds[i].date + '</td>';
                } else {
                    code += '<td></td><td></td>';
                }
                if (properties[i] && properties[i].name) {
                    code += '<td><span>' + properties[i].name + '</span></td>';
                } else {
                    code += '<td></td>';
                }
                code += '</tr>';
            }

            this._elements.menu.builds.innerHTML = code;

            this._changeTable('project-builds');

        } else if (message.event == 'fs.entry.list.success') {

            this._changeEnvironment();

            this._elements.menu.entry.innerHTML = message.data.fs_entries
                .reduce(function (prev, cur) {
                    return prev + '<tr><td>' + cur.name + '</td><td><a>download</a></td></tr>';
                }, '');

            this._changeTable('project-entry');

        }
    }

    , _changeEnvironment: function() {

        var path = '<span onclick="Project._comeBack();">jobs</span>';

        var info = '';
        for (var key in this._url) {
            path += '<span onclick="Project._comeBack(\'' + key + '\');">'
                + this._url[key] + '</span>';
            info += '<li>' + key.capitalize() + ': ' + this._url[key] + '</li>';
        }

        this._elements.path_block.innerHTML = path;
        this._elements.info_block.innerHTML = info;

        Hash.set(this._url);
    }

    , _changeTable: function(table) {
        for (var key in this._elements.nav) {
            this._elements.nav[key].className = table;
        }
    }

    , _comeBack: function(part) {
        if (part) {
            var url = JSON.stringify(this._url);
            this._url = JSON.parse(url.slice(0, url.indexOf(',', url.indexOf('\"' + part + '\":'))) + '}');

            eval('var part_value = this._url.' + part);
            eval('Project.goIn' + part.capitalize() + 'List("' + part_value + '");');
        } else {
            this._url = {};
            Project.goInList();
        }
    }
};