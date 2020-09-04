import { createStore } from 'redux';
import React, { Component } from "react";

var toastCounter = 0;
var messageCounter = 0;
const TOAST_DURATION = 2500;
const MESSAGE_DURATION = 30000;
const TYPING_PERIOD = 2200;

var MY_ID = null;
const PLAYBACK_SUPPORT = Hls.isSupported() || iOSSafari

var isFirstPlay = true;

function time() {
    return new Date().getTime() / 1000
}

function timeMS() {
    return new Date().getTime()
}

function reducers(state = 0, action) {
    switch (action.type) {
        case 'INIT': {
            if (window.initialState.is_loggedin) {
                MY_ID = window.initialState.me.user_id
            }
            var st = { ...window.initialState, toasts: [], showAutoplayBanner: false, messages: [], typingUsers: [] }
            return st;
        }
        case 'UPDATE': {
            return action.state
        }
        default:
            return state
    }
}

let store = createStore(reducers);

function update(st) {
    store.dispatch({ type: 'UPDATE', state: st });
}


class Live {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.no_retries = 0;
        this.MAX_RETRIES = 5;
        this.connect()
    }
    connect = () => {
        this.socket = null;
        this.no_retries++;
        this.isConnected = false;
        var hostUrl = window.location.host;
        var protocol = 'wss://'
        if (hostUrl.split(':')[0] == 'localhost' || hostUrl.split('.')[0] == '192') {
            protocol = 'ws://'
        }
        this.socket = new WebSocket(protocol + hostUrl + '/live');
        this.socket.onopen = this._onOpen;
        this.socket.onclose = this._onClose;
        this.socket.onerror = this._onError;
        this.socket.onmessage = this._onMessage;
    }
    retry = () => {
        if (!this.isConnected) {
            this.socket = null;
            if (this.no_retries < this.MAX_RETRIES) {
                this.no_retries++;
                var timeout = 3000 * (this.no_retries + 1);
                window.setTimeout(this.connect, timeout);
            }
            else {
                console.warn('MAX Retries reached, No connection!');
                this.no_retries = 0;
                state.toast('No internet')
                window.setTimeout(this.retry, 7 * 60 * 1000); //7 mins
            }
        }
    }
    _onOpen = (event) => {
        console.log('connection LIVE!')
        state.toast('Connected')
        this.no_retries = 0;
        this.isConnected = true;
    }
    _onClose = (event) => {
        console.warn('connection DOWN!')
        state.toast('No connection')
        this.isConnected = false;
        this.retry()
    }
    _onError = (event) => {
        console.error('connection error!', event)
        state.toast('Connection error')
    }
    _onMessage = (event) => {
        var data = JSON.parse(event.data);
        var type = data.type;
        var user = data.action_user
        switch (type) {
            case 'chat.text': {
                state.message(data.date, user, data.text)
                break;
            }
            case 'chat.typing': {
                state.typing(data.date, data.user_id, data.isTyping)
                break;
            }
            case 'update.members.connected': {
                if (user.user_id != MY_ID)
                    state.toast(user.name + ' connected', '/room/members')
                break;
            }
            case 'update.members.disconnected': {
                if (user.user_id != MY_ID)
                    state.toast(user.name + ' disconnected', '/room/members')
                break;
            }
            case 'update.members.add': {
                if (user.user_id != MY_ID) {
                    state.addRoomMember(user, data.is_friend)
                    var txt = user.name + ' joined'
                    state.toast(txt, '/room/members')
                }
                break;
            }
            case 'update.members.remove': {
                if (user.user_id != MY_ID) {
                    state.removeRoomMember(user)
                    state.toast(user.name + ' left', '/room/members')
                }
                break;
            }
            case 'update.tracks.add': {
                state.addRoomtrack(data.roomtrack)
                if (user.user_id != MY_ID) {
                    state.toast(user.name + ' added ' + data.roomtrack.title, '/room')
                }
                break;
            }
            case 'update.tracks.remove': {
                state.removeRoomtrack(data.roomtrack)
                if (user.user_id != MY_ID) {
                    state.toast(user.name + ' removed ' + data.roomtrack.title, '/room')
                }
                break;
            }
            case 'update.playback.pause': {
                state.updatePlayback(data.room)
                var name = user.name
                if (user.user_id == MY_ID) {
                    name = 'You'
                }
                state.toast(name + ' paused the music', '/room')
                break;
            }
            case 'update.playback.skipto': {
                var oldTrack = state.getState().room.current_roomtrack
                var wasPaused = state.getState().room.is_paused
                state.updatePlayback(data.room)
                var track = data.room.current_roomtrack
                if (user) {
                    var name = user.name
                    if (user.user_id == MY_ID) {
                        name = 'You'
                    }
                    var txt = name + ' changed the track to ' + track.title
                    if (oldTrack.roomtrack_id == track.roomtrack_id) {
                        if (wasPaused && !data.room.is_paused) {
                            txt = name + ' resumed music'
                        }
                        else {
                            txt = name + ' seeked the track'
                        }
                    }
                    state.toast(txt, '/room')
                }
                else {
                    state.toast('Now playing ' + track.title, '/room')
                }
                break;
            }
            default: {
                console.debug('unknown live msg', data);
            }
        }
    }
    send = (type, data) => {
        var body = JSON.stringify({ ...data, type })
        if (this.socket && this.isConnected) {
            this.socket.send(body);
        }
        else {
            console.warn('Cant send msg, connection down', type, data);
        }
    }
}

var socket = null;

class Playback {
    constructor(track_id, url, sleek = 0, canPlay = true) {
        this.state = {
            url: null,
            track_id: null,
            started_on: null,
            sleek: 0,
            is_playing: false,
            can_play: true,
            is_loaded: false
        }
        this.state.url = url
        this.state.track_id = track_id
        this.state.sleek = sleek
        this.state.can_play = canPlay
        this.hls = new Hls();
        this.player = window.player;
        if (iOSSafari) {
            this.player.src = this.state.url;
            this._onPlaylistLoaded()
        }
        else {
            this.hls.attachMedia(this.player);
            this.hls.on(Hls.Events.MANIFEST_PARSED, this._onPlaylistLoaded);
            this.hls.on(Hls.Events.ERROR, this._onError);
            this.hls.on(Hls.Events.MEDIA_ATTACHED, this.loadUrl)
        }
    }
    kill() {
        this.hls.destroy();
    }
    loadUrl = () => {
        this.hls.loadSource(this.state.url);
    }
    play(sleek = null) {
        if (sleek) {
            this.state.started_on = time()
            this.state.sleek = sleek
        }
        this.state.can_play = true
        this.state.is_playing = true
        var currTime = time()
        var timePassed = currTime - this.state.started_on;
        console.log('curr sleek', this.state.sleek)
        this.player.currentTime = timePassed + this.state.sleek
        var promise = this.player.play();
        if (promise !== undefined) {
            promise.then(_ => {
                if (iOSSafari && isFirstPlay) {
                    //cuz in ios it always starts from the begining
                    isFirstPlay = false
                    window.setTimeout(() => {
                        state.syncPlayback()
                    }, 200)
                }
            }).catch(error => {
                // Autoplay was prevented.
                // Show a "Play" button so that user can start playback.
                this.state.is_playing = false
                var st = state.getState()
                st.showAutoplayBanner = true
                update(st)
            });
        }
    }
    pause() {
        this.state.can_play = false
        this.state.is_playing = false
        this.state.started_on = time()
        this.state.sleek = this.player.currentTime
        this.player.pause();
    }
    _onPlaylistLoaded = (e, data) => {
        this.state.started_on = time()
        this.state.is_loaded = true
        if (this.state.can_play)
            this.play();
    }
    _onError = (e, data) => {
        var errorType = data.type;
        var errorDetails = data.details;
        var errorFatal = data.fatal;

        switch (data.details) {
            case Hls.ErrorDetails.FRAG_LOAD_ERROR:
                // ....
                break;
            default:
                break;
        }
    }
}

window.player.addEventListener('loadedmetadata', (event) => {
    //mainly needed for ios to check for plist loaded
    if (iOSSafari) {
        state.syncPlayback()
    }
});

/*
//this makes plaback go crazy
//apperantly hls seeks thes track ever now and then which causes this event to fire
window.player.addEventListener('seeked', (event) => {
    console.log('seeked', event)
    state.syncPlayback()
});
*/

window.player.addEventListener('play', (event) => {
    if (state.player) {
        if (!state.player.state.is_playing) {
            state.play()
        }
    }
});

window.player.addEventListener('pause', (event) => {
    if (state.player) {
        if (state.player.state.is_playing) {
            var st = state.getState()
            if (window.player.currentTime < st.room.current_roomtrack.duration - 2) {
                console.log('pausing', window.player.currentTime, st.room.current_roomtrack.duration)
                state.pause()
            }
            else {
                //usually browser pauses the player after track finished
                console.warn('Cant pause near end')
            }

        }
    }
});

const sampleMsg = {
    date: time(),
    from: { user_id: 1, name: 'Sample User' },
    text: "Hello everyone!"
}

var state = {
    getState: store.getState,
    subscribe: store.subscribe,
    player: null,
    init: function () {
        if (window.initialState.is_loggedin) {
            socket = new Live()
        }
        store.dispatch({ type: 'INIT' });
        var st = store.getState();
        if (st.room) {
            this.changeRoom(st.room)
        }
    },
    popTyping(user_id) {
        var st = store.getState();
        if ((user_id in st.typingUsers) && (st.typingUsers[user_id] + TYPING_PERIOD <= timeMS())) {
            delete st.typingUsers[user_id]
            update(st)
        }
    },
    typing(date, user_id, isTyping) {
        var st = store.getState();
        if (isTyping) {
            st.typingUsers[user_id] = date
            update(st)
            window.setTimeout(() => {
                this.popTyping(user_id)
            }, TYPING_PERIOD + 900)
        }
        else {
            if (user_id in st.typingUsers) {
                delete st.typingUsers[user_id]
                update(st)
            }
        }
    },
    setIsTyping(isTyping) {
        var st = store.getState();
        if (st.room) {
            socket.send('chat.typing', { isTyping, date: timeMS() })
        }
    },
    getTopMessages(getUserIds = false) {
        var st = store.getState();
        var msgs = st.messages
        var top = [];
        var user_ids = []
        for (var i = msgs.length - 1; i >= 0; i--) {
            if (!user_ids.includes(msgs[i].from.user_id)) {
                top.splice(0, 0, msgs[i])
                user_ids.push(msgs[i].from.user_id)
            }
            if (top.length > 3) {
                break;
            }
        }
        if (getUserIds)
            return user_ids
        return top;
    },
    sendMessage(text) {
        var st = store.getState();
        if (st.room) {
            socket.send('chat.text', { text, date: time() })
        }
    },
    message(date, from, text) {
        var st = store.getState();
        var key = messageCounter;
        messageCounter++;
        st.messages.push({ key, date, from, text })
        update(st)
        var loc = window.location.pathname;
        if (loc != '/room'&&loc != '/room/chat') {
            this.toast(<div>
                <div className="base-semibold" style={{ fontSize: '0.95rem' }}>
                    {from.name}
                </div>
                <div>
                    {text}
                </div>
            </div>,'/room/chat')
        }
        window.setTimeout(() => {
            this.popMessage(key)
        }, MESSAGE_DURATION)
    },
    popMessage(key) {
        var st = store.getState();
        var msgs = st.messages.filter((msg) => { return msg.key != key })
        st.messages = msgs;
        update(st);
    },
    closeAutoplayBanner() {
        var st = store.getState();
        st.showAutoplayBanner = false;
        update(st)
    },
    popToast: function (key) {
        var st = store.getState();
        var toasts = st.toasts.filter((toast) => { return toast.key != key })
        st.toasts = toasts;
        update(st);
    },
    toast: function (html, link = null) {
        var key = toastCounter;
        toastCounter++;
        var st = store.getState();
        st.toasts.push({ key, html, link });
        if (st.toasts.length > 3) {
            st.toasts.splice(0, 1)
        }
        update(st)
        window.setTimeout(() => {
            this.popToast(key)
        }, TOAST_DURATION)
    },
    syncPlayback: function () {
        if (PLAYBACK_SUPPORT) {
            var st = store.getState();
            console.log('Syncing playback..')
            if (st.room) {
                var roomtrack = st.room.current_roomtrack
                var sleek = roomtrack.duration - st.room.duration_to_complete + (time() - (new Date(st.room.play_start_time).getTime() / 1000))
                if (this.player && this.player.state.track_id == roomtrack.track_id) {
                    if (!st.room.is_paused)
                        this.player.play(sleek)
                    else
                        this.player.pause()
                }
                else {
                    if (this.player) {
                        this.player.kill()
                        this.player = null
                    }
                    this.player = new Playback(roomtrack.track_id, roomtrack.playback_url, sleek, !st.room.is_paused)
                }
            }
            else {
                if (this.player) {
                    this.player.kill()
                    this.player = null
                }
            }
        }
        else {
            this.toast('Streaming not supported on this device')
        }
    },
    updatePlayback: function (roomState) {
        var st = store.getState();
        var room = { ...st.room, ...roomState }
        st.room = room
        update(st)
        this.syncPlayback()
    },
    addRoomtrack: function (track) {
        var st = store.getState();
        if (st.room.tracks) {
            var alreadyThere = st.room.tracks.find((rt) => { return rt.roomtrack_id == track.roomtrack_id })
            if (!alreadyThere) {
                st.room.tracks.push(track)
                update(st)
            }
        }
    },
    removeRoomtrack: function (track) {
        var st = store.getState();
        if (st.room.tracks) {
            var index = st.room.tracks.findIndex((rt) => { return rt.roomtrack_id == track.roomtrack_id })
            if (index >= 0) {
                st.room.tracks.splice(index, 1)
                update(st)
            }
        }
    },
    addRoomMember: function (user, isFriend) {
        var st = store.getState();
        var grp = 'others'
        if (isFriend) {
            grp = 'friends'
        }
        if (st.room.members) {
            var alreadyThere = st.room.members[grp].find((member) => { return member.user_id == user.user_id })
            if (!alreadyThere) {
                st.room.members[grp].push(user)
                st.room.members_count++;
                console.log(user, 'joined', grp, st.room.members)
                update(st)
            }
        }
    },
    removeRoomMember: function (user) {
        var look = (grp) => {
            var index = st.room.members[grp].findIndex((member) => { return member.user_id == user.user_id })
            if (index >= 0) {
                st.room.members[grp].splice(index, 1)
                st.room.members_count--;
                console.log(user, 'left', grp, index)
                update(st)
                return true;
            }
            return false;
        }
        var st = store.getState();
        if (st.room.members) {
            if (!look('friends')) {
                look('others')
            }
        }
    },
    updateRoomMembers: function () {
        var st = store.getState();
        if (st.room != null) {
            api.get('room/members', null, (status, data) => {
                if (status == 200) {
                    console.log('got room members', data)
                    //data={friends,others}
                    st = store.getState();
                    if (st.room != null) {
                        st.room.members_count = data.friends.length + data.others.length
                        st.room.members = data
                        update(st)
                    }
                }
                else {
                    console.error(status, data)
                }
            })
        }
    },
    updateRoomTracks: function () {
        var st = store.getState();
        if (st.room != null) {
            api.get('room/tracks', null, (status, data) => {
                if (status == 200) {
                    console.log('got room tracks', data)
                    st = store.getState();
                    if (st.room != null) {
                        st.room.tracks = data.roomtracks
                        update(st)
                    }
                }
                else {
                    console.error(status, data)
                }
            })
        }
    },
    leaveRoom: function () {
        var st = store.getState();
        if (st.room != null) {
            api.get('room/leave', null, (status, data) => {
                if (status == 201) {
                    st = store.getState();
                    if (st.room != null) {
                        st.room = null;
                        st.messages = []
                        st.typingUsers = []
                        update(st)
                        this.toast('You left the room')
                        this.syncPlayback()
                    }
                }
                else {
                    this.toast('error: Could not leave the room')
                    console.error(status, data)
                }
            })
        }
    },
    changeRoom: function (room) {
        var st = store.getState();
        room.members = null;
        room.tracks = null;
        st.room = room
        st.messages = []
        st.typingUsers = []
        update(st)
        this.syncPlayback()
        this.updateRoomMembers()
        this.updateRoomTracks()
    },
    joinRoom: function (roomId, cb = function () { }) {
        api.post('room/join', { room_id: roomId }, (status, data) => {
            if (status == 201) {
                this.changeRoom(data)
                this.toast('Welcome to the room', '/room')
                cb(true, data)
            }
            else {
                console.error(status, data)
                cb(false)
            }
        })
    },
    createRoom: function (trackIds, cb = function () { }) {
        api.post('room/create', { track_ids: trackIds }, (status, data) => {
            if (status == 201) {
                this.changeRoom(data)
                this.toast('Room created', '/room')
                cb(true, data)
            }
            else {
                console.error(status, data)
                cb(false)
            }
        })
    },
    removeTrack: function (roomtrackId, cb = function () { }) {
        api.post('room/tracks/remove', { roomtrack_ids: [roomtrackId] }, (status, data) => {
            if (status == 201) {
                this.toast('Track removed', '/room')
                cb(true)
            }
            else {
                cb(false)
            }
        })
    },
    play() {
        var st = store.getState();
        if (st.room) {
            if (st.room.is_paused) {
                socket.send('set.playback.play')
            }
        }
    },
    pause() {
        var st = store.getState();
        if (st.room) {
            if (!st.room.is_paused) {
                socket.send('set.playback.pause')
            }
        }
    },
    skipTo(roomtrackId, duration = null) {
        var st = store.getState();
        if (st.room) {
            socket.send('set.playback.skipto', { roomtrack_id: roomtrackId, duration })
        }
    }
}

export default state;