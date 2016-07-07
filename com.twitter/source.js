// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of ThingEngine
//
// Copyright 2015-2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details

const Tp = require('thingpedia');
const Q = require('q');

const SourceBase = require('./source_base');

module.exports = SourceBase(false, function(event) {
    var text = event[0];
    var hashtags = event[1];
    var urls = event[2];
    var from = event[3];
    var inReplyTo = event[4];

    return '@' + from + ' tweeted: ' + text;
}, function(tweet, hashtags, urls) {
    var event = [tweet.text,
                 hashtags,
                 urls,
                 tweet.user.screen_name,
                 tweet.in_reply_to_screen_name,
                 false]; // for compat
    this.emitEvent(event);
});