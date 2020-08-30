import { createStore } from 'redux';

var toastCounter = 0;
const TOAST_DURATION = 2500;

var MY_ID = null;

function reducers(state = 0, action) {
    switch (action.type) {
        case 'INIT': {
            if (window.initialState.is_loggedin) {
                MY_ID = window.initialState.me.user_id
            }
            var st = { ...window.initialState, toasts: [] }
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

/*
var playbackState={
    url:'/audio/1.m3u8',
    id:567,
    started_on:45678779,
    sleek:120
}
*/


class Live {
    socket = null;
    isConnected = false;
    no_retries = 0;
    MAX_RETRIES = 5;
    constructor() {
        this.connect()
    }
    connect = () => {
        this.socket = null;
        this.no_retries++;
        this.isConnected = false;
        var hostUrl = window.location.hostname;
        var protocol = 'wss://'
        if (hostUrl == 'localhost') {
            hostUrl += ':8000'
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
    }
    _onMessage = (event) => {
        var data = JSON.parse(event.data);
        var type = data.type;
        var user = data.action_user
        switch (type) {
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
                var oldTrack=state.getState().room.current_roomtrack
                var wasPaused=state.getState().room.is_paused
                state.updatePlayback(data.room)
                var track = data.room.current_roomtrack
                if (user) {
                    var name = user.name
                    if (user.user_id == MY_ID) {
                        name = 'You'
                    }
                    var txt=name + ' changed the track to ' + track.title
                    if(oldTrack.roomtrack_id==track.roomtrack_id){
                        if(wasPaused&&!data.room.is_paused){
                            txt=name+' resumed music'
                        }
                        else{
                            txt=name+' seeked the track'
                        }
                    }
                    state.toast(txt, '/room')
                }
                else{
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

var state = {
    getState: store.getState,
    subscribe: store.subscribe,
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
        var st = store.getState();
        console.log('Syncing playback..')
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
                //send to channel
            }
        }
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