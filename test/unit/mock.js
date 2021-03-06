// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// Copyright 2018 The Board of Trustees of the Leland Stanford Junior University
//
// Author: Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See LICENSE for details
"use strict";

const assert = require('assert');
const path = require('path');
const child_process = require('child_process');
const os = require('os');
const fs = require('fs');
const Tp = require('thingpedia');

const _unzipApi = {
    unzip(zipPath, dir) {
        var args = ['-uo', zipPath, '-d', dir];
        return new Promise((resolve, reject) => {
            child_process.execFile('/usr/bin/unzip', args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
                if (err)
                    reject(err);
                else
                    resolve([stdout, stderr]);
            });
        }).then(([stdout, stderr]) => {
            console.log('stdout', stdout);
            console.log('stderr', stderr);
        });
    }
};

const _contentApi = {
    getStream(url) {
        return new Promise((resolve, reject) => {
            if (url.startsWith('file:///')) {
                const path = url.substring('file://'.length);
                child_process.execFile('xdg-mime', ['query', 'filetype', path], (err, stdout, stderr) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    let stream = fs.createReadStream(path);
                    stream.contentType = String(stdout).trim();
                    resolve(stream);
                });
            } else {
                reject(new Error('Unsupported url ' + url));
            }
        });
    }
};

class ThingpediaClient extends Tp.HttpClient {
    constructor(platform) {
        super(platform, 'https://thingpedia.stanford.edu/thingpedia');
    }

    async _getLocalDeviceManifest(manifestPath, deviceKind) {
        const classDef = await super._getLocalDeviceManifest(manifestPath, deviceKind);

        // copy some metadata that is required by the tests and would be provided by Thingpedia
        if (!classDef.metadata.name)
            classDef.metadata.name = classDef.metadata.thingpedia_name;
        if (!classDef.metadata.description)
            classDef.metadata.description = classDef.metadata.thingpedia_description;

        return classDef;
    }
}

function getGitConfig(key, _default) {
    try {
        const args = ['config', '--get', '--default', _default || '', key];
        const stdout = child_process.execFileSync('git', args);
        return String(stdout).trim() || _default;
    } catch(e) {
        // ignore error if git is not installed
        if (e.code !== 'ENOENT')
            throw e;
        // also ignore error if the key
        return _default;
    }
}

class MemoryPreferences extends Tp.Preferences {
    constructor() {
        super();
        this._prefs = {};
    }

    keys() {
        return Object.keys(this._prefs);
    }

    get(name) {
        return this._prefs[name];
    }

    set(name, value) {
        let changed = this._prefs[name] !== value;
        this._prefs[name] = value;
        if (changed)
            this.emit('changed', name);
        return value;
    }

    delete(name) {
        delete this._prefs[name];
        this.emit('changed', name);
    }

    changed(name = null) {
        this.emit('changed', name);
    }

    flush() {
        return Promise.resolve();
    }

    saveCopy(to) {
        return Promise.resolve();
    }
}

class TestPlatform extends Tp.BasePlatform {
    constructor() {
        super();

        this._thingpedia = new ThingpediaClient(this);
        this._prefs = new MemoryPreferences();


        this._developerKey = getGitConfig('thingpedia.developer-key', process.env.THINGENGINE_DEVELOPER_KEY || undefined);
        this._prefs.set('developer-key', this._developerKey);
        this.setRelease('main');
    }

    setRelease(release) {
        this._prefs.set('developer-dir', path.resolve(path.dirname(module.filename), '../..', release));
    }

    getDeveloperKey() {
        return this._developerKey;
    }
    get type() {
        return 'test';
    }
    get locale() {
        return 'en-US';
    }
    get timezone() {
        return 'America/Los_Angeles';
    }

    getSharedPreferences() {
        return this._prefs;
    }

    getCacheDir() {
        return path.dirname(module.filename);
    }
    getTmpDir() {
        return os.tmpdir();
    }
    hasCapability(cap) {
        switch (cap) {
        case 'code-download':
        case 'content-api':
        case 'thingpedia-client':
            return true;
        default:
            return false;
        }
    }
    getCapability(cap) {
        switch (cap) {
        case 'code-download':
            return _unzipApi;
        case 'content-api':
            return _contentApi;
        case 'thingpedia-client':
            return this._thingpedia;
        default:
            return null;
        }
    }
}

class TestEngine extends Tp.BaseEngine {
    constructor() {
        super(new TestPlatform);
    }
    get devices() {
        throw assert.fail('nothing should call this');
    }
    get apps() {
        throw assert.fail('nothing should call this');
    }
    get stats() {
        throw assert.fail('nothing should call this');
    }
}
module.exports = new TestEngine;
