// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// Copyright 2018 Google LLC
//
// See LICENSE for details
"use strict";

const assert = require('assert');

module.exports = [
    ['query', 'web_search', { query: 'pizza' }, (results) => {
        for (let result of results) {
            assert.strictEqual(typeof result.title, 'string');
            assert.strictEqual(typeof result.description, 'string');
            assert(result.link.startsWith('http'));

            // either the title or the description should have pizza
            // somewhere
            assert(result.title.toLowerCase().indexOf('pizza') >= 0 ||
                   result.description.toLowerCase().indexOf('pizza') >= 0);
        }
    }],

    ['query', 'image_search', { query: 'almond' }, (results) => {
        for (let result of results) {
            assert.strictEqual(typeof result.title, 'string');
            assert(result.link.startsWith('http'));
            assert(result.picture_url.startsWith('http'));
            assert.strictEqual(typeof result.width, 'number');
            assert.strictEqual(typeof result.height, 'number');
        }
    }],
];
