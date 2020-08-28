import { createStore } from 'redux';

function reducers(state = 0, action) {
    switch (action.type) {
        case 'INIT': {
            var st = window.initialState
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

var state = {
    getState: store.getState,
    subscribe: store.subscribe,
    init: function () {
        store.dispatch({ type: 'INIT' });
        var st = store.getState();
        if (st.room) {
            this.changeRoom(st.room)
        }
    },
    syncPlayback: function () {
        var st = store.getState();
        console.log('Syncing playback..')
        update(st)
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
                        this.syncPlayback()
                    }
                }
                else {
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
                console.log('room joined!', data)
                this.changeRoom(data)
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
                console.log('room created!', data)
                this.changeRoom(data)
                cb(true, data)
            }
            else {
                console.error(status, data)
                cb(false)
            }
        })
    }
}

export default state;