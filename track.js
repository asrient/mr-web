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
    render() {
        return (<div className={css.trackContainer}>
            <div className={css.content}>
                <div onClick={this.click} className={css.art}></div>
                <div>
                    <div onClick={this.click} className={css.title + " ink-white base-semilight"}>{this.props.title}</div>
                    <div className={css.artists + " ink-grey base-light"}>{this.props.artists}</div>
                </div>
            </div>
            <div style={{alignItems: 'center', display: 'flex'}}>
            <div className={css.duration}>{this.props.duration}</div>
                {this.props.children}
            </div>
        </div>)
    }
}

export { TrackItem };