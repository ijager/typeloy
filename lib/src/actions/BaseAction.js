"use strict";
var path = require('path');
var fs = require('fs');
var LinuxTaskBuilder_1 = require("../TaskBuilder/LinuxTaskBuilder");
var SunOSTaskBuilder_1 = require("../TaskBuilder/SunOSTaskBuilder");
var SessionManager_1 = require('../SessionManager');
var SummaryMap_1 = require("../SummaryMap");
var PluginRunner_1 = require("../PluginRunner");
var _ = require('underscore');
var os = require('os');
require('colors');
var kadiraRegex = /^meteorhacks:kadira/m;
var BaseAction = (function () {
    function BaseAction(config, cwd) {
        this.cwd = cwd;
        this.config = config;
        this.sessionManager = new SessionManager_1.SessionManager({
            "keepAlive": false
        });
        this.pluginRunner = new PluginRunner_1.PluginRunner(config, cwd);
        // Get settings.json into env,
        // The METEOR_SETTINGS can be used for setting up meteor application without passing "--settings=...."
        //
        // Here is the guide of using METEOR_SETTINGS
        // https://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-using-settingsjson
        //
        // @see http://joshowens.me/environment-settings-and-security-with-meteor-js/
        var setttingsJsonPath = path.resolve(this.cwd, 'settings.json');
        if (fs.existsSync(setttingsJsonPath)) {
            this.config.env['METEOR_SETTINGS'] = JSON.stringify(require(setttingsJsonPath));
        }
    }
    /**
    * Return the task builder by operating system name.
    */
    BaseAction.prototype.getTaskBuilderByOs = function (os) {
        switch (os) {
            case "linux":
                return new LinuxTaskBuilder_1.default;
            case "sunos":
                return new SunOSTaskBuilder_1.default;
            default:
                throw new Error("Unsupported operating system.");
        }
    };
    /**
     * Create sessions maps for only one site. It's possible to have more than
     * one servers in one site.
     *
     * the structure of sessions map is:
     *
     * [os:string] = SessionMap;
     *
    * @param {object} config (the mup config object)
    */
    BaseAction.prototype.createSiteSessionsMap = function (config, siteName) {
        if (!siteName) {
            siteName = "default";
        }
        return this.sessionManager.createOsMap(config.sites[siteName].servers);
    };
    // Extract this to Kadira plugin
    BaseAction.prototype._showKadiraLink = function () {
        var versionsFile = path.join(this.config.app.directory, '.meteor/versions');
        if (fs.existsSync(versionsFile)) {
            var packages = fs.readFileSync(versionsFile, 'utf-8');
            var hasKadira = kadiraRegex.test(packages);
            if (!hasKadira) {
                console.log("“ Checkout " + "Kadira" + "!" +
                    "\n  It's the best way to monitor performance of your app." +
                    "\n  Visit: " + "https://kadira.io/mup" + " ”\n");
            }
        }
    };
    BaseAction.prototype.executePararell = function (actionName, deployment, args) {
        var _this = this;
        var sessionsMap = this.createSiteSessionsMap(this.config, null);
        var sessionInfoList = _.values(sessionsMap);
        var promises = _.map(sessionInfoList, function (sessionGroup) {
            return new Promise(function (resolve) {
                var taskListsBuilder = _this.getTaskBuilderByOs(sessionGroup.os);
                var taskList = taskListsBuilder[actionName].apply(taskListsBuilder, args);
                taskList.run(sessionGroup.sessions, function (summaryMap) {
                    resolve(summaryMap);
                });
            });
        });
        return new Promise(function (resolveCompleted) {
            Promise.all(promises).then(function (mapResults) {
                _this.whenAfterCompleted(deployment, mapResults);
                resolveCompleted(mapResults);
            });
        });
    };
    /**
     * Initalize a project from example files.
     */
    BaseAction.prototype.init = function () {
        var destConfigJson = path.resolve('typeloy.json');
        var destSettingsJson = path.resolve('settings.json');
        if (fs.existsSync(destConfigJson) || fs.existsSync(destSettingsJson)) {
            console.error('A Project Already Exists');
            // XXX:
            process.exit(1);
        }
        var exampleJson = path.resolve(__dirname, '../example/typeloy.json');
        var exampleSettingsJson = path.resolve(__dirname, '../example/settings.json');
        copyFile(exampleJson, destConfigJson);
        copyFile(exampleSettingsJson, destSettingsJson);
        console.log('New Project Initialized!');
        function copyFile(src, dest) {
            var content = fs.readFileSync(src, 'utf8');
            fs.writeFileSync(dest, content);
        }
    };
    /**
    * After completed ....
    *
    * Right now we don't have things to do, just exit the process with the error
    * code.
    */
    BaseAction.prototype.whenAfterCompleted = function (deployment, summaryMaps) {
        this.pluginRunner.whenAfterCompleted(deployment);
        var errorCode = SummaryMap_1.haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
        var promises;
        if (errorCode != 0) {
            this.whenFailure(deployment, summaryMaps);
        }
        else {
            this.whenSuccess(deployment, summaryMaps);
        }
    };
    BaseAction.prototype.whenSuccess = function (deployment, summaryMaps) {
        return this.pluginRunner.whenSuccess(deployment);
    };
    BaseAction.prototype.whenFailure = function (deployment, summaryMaps) {
        return this.pluginRunner.whenFailure(deployment);
    };
    return BaseAction;
}());
exports.BaseAction = BaseAction;
//# sourceMappingURL=BaseAction.js.map