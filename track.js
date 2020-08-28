import $ from "jquery";
import React, { Component } from "react";
import { Link, Route } from "wouter";
import css from "./track.css";


class TrackItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    click = () => {
        if (this.props.onClick) {
            this.props.onClick(this.props.track_id)
        }
    }
    duration() {
        
            if (!this.props.playing)
                return (<div className={css.duration}>{this.props.duration}</div>)
        
    }
    render() {
        var contCls = css.trackContainer;
        if (this.props.playing) {
            contCls += ' ' + css.playing
        }
        return (<div className={contCls}>
            <div className={css.content}>
                <div onClick={this.click} className={css.art}></div>
                <div>
                    <div onClick={this.click} className={css.title + " ink-white base-semilight"}>{this.props.title}</div>
                    <div className={css.artists + " ink-grey base-light"}>{this.props.artists}</div>
                </div>
            </div>
            <div style={{ alignItems: 'center', display: 'flex' }}>
                {this.duration()}
                {this.props.children}
            </div>
        </div>)
    }
}

export { TrackItem };