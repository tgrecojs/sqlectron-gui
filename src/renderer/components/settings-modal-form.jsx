import React, { Component, PropTypes } from 'react';
import { shell } from 'electron'; // eslint-disable-line import/no-unresolved
import set from 'lodash.set';
import Select from 'react-select';
import Checkbox from './checkbox.jsx';


require('react-select/dist/react-select.css');
require('./override-select.css');


export default class SettingsModalForm extends Component {
  static propTypes = {
    onSaveClick: PropTypes.func.isRequired,
    onCancelClick: PropTypes.func.isRequired,
    config: PropTypes.object,
    error: PropTypes.object,
  }

  constructor(props, context) {
    super(props, context);
    this.state = {
      ...props.config.data,
    };
  }

  componentDidMount() {
    $(this.refs.settingsModal).modal({
      closable: true,
      detachable: false,
      allowMultiple: true,
      observeChanges: true,
      onHidden: () => {
        this.props.onCancelClick();
        return true;
      },
      onDeny: () => {
        this.props.onCancelClick();
        return true;
      },
      onApprove: () => false,
    }).modal('show');
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ error: nextProps.error });
  }

  componentWillUnmount() {
    $(this.refs.settingsModal).modal('hide');
  }

  onSaveClick() {
    this.props.onSaveClick(this.mapStateToConfig(this.state));
  }

  onDocClick(event) {
    event.preventDefault();
    shell.openExternal('https://github.com/sqlectron/sqlectron-gui/blob/master/docs/app/configuration-file.md');
  }

  mapStateToConfig(state) {
    const config = {
      zoomFactor: parseFloat(state.zoomFactor) || 1,
      limitQueryDefaultSelectTop: parseInt(state.limitQueryDefaultSelectTop, 10) || 100,
      enabledAutoComplete: state.enabledAutoComplete || false,
      enabledLiveAutoComplete: state.enabledLiveAutoComplete || false,
    };
    if (!this.state.log) { return config; }

    const { log } = state;
    config.log = {
      console: log.console,
      file: log.file,
      level: log.level,
      path: log.path,
    };

    return config;
  }

  highlightError(name) {
    const { error } = this.state;
    let hasError = !!(error && error[name]);
    if (error && error.log && /^log\./.test(name)) {
      const logErrors = error.log[0].errors[0];
      const lastName = name.replace(/^log\./, '');
      hasError = !!~Object.keys(logErrors).indexOf(lastName);
    }
    return hasError ? 'error' : '';
  }

  handleChange(event) {
    const newState = {};
    const { target } = event;
    const value = target.files ? target.files[0].path : target.value;
    const name = target.name.replace(/^file\./, '');
    const [name1, name2] = name.split('.');

    if (name1 && name2) {
      newState[name1] = { ...this.state[name1] };
    }

    set(newState, name, value);

    return this.setState(newState);
  }

  handleOnLogLevelChange(level) {
    this.setState({ log: { ...this.state.log, level } });
  }

  renderLogLevelItem({ label, icon }) {
    return (
      <span>
        <i className={`icon ${icon}`}></i> {label}
      </span>
    );
  }

  renderActionsPanel() {
    return (
      <div className="actions">

        <div className="small ui black deny right labeled icon button"
          tabIndex="0">
          Cancel
          <i className="ban icon"></i>
        </div>
        <div className="small ui green right labeled icon button"
          tabIndex="0"
          onClick={::this.onSaveClick}>
          Save
          <i className="checkmark icon"></i>
        </div>
      </div>
    );
  }

  renderSettingsPath() {
    /* eslint max-len:0 */
    return (
      <div className="two fields">
        <div className="field">
          <div className="ui label">
            Path
            <div className="detail">{this.props.config.path}</div>
          </div>
        </div>
        <div className="field">
          Check out the full settings documentation at <a href="#" onClick={this.onDocClick}>here</a>
        </div>
      </div>
    );
  }

  renderBasicSettingsPanel() {
    /* eslint max-len:0 */
    return (
      <div>
        <div className="two fields">
          <div className={`field ${this.highlightError('zoomFactor')}`}>
            <label>Zoom Factor</label>
            <input type="number"
              name="zoomFactor"
              value={this.state.zoomFactor || ''}
              onChange={::this.handleChange} />
            <p className="help">Zoom factor is zoom percent divided by 100, so 300% = 3.0.</p>
          </div>
          <div className={`field ${this.highlightError('limitQueryDefaultSelectTop')}`}>
            <label>Limit of Rows from Select Top Query</label>
            <input type="number"
              name="limitQueryDefaultSelectTop"
              value={this.state.limitQueryDefaultSelectTop || ''}
              onChange={::this.handleChange} />
            <p className="help">The limit used in the default select from the sidebar context menu.</p>
          </div>
        </div>

        <div className="two fields">
          <div className="field">
            <Checkbox
              name="enabledAutoComplete"
              label="Enabled Auto Complete"
              defaultChecked={this.state.enabledAutoComplete}
              onChecked={() => this.setState({ enabledAutoComplete: true })}
              onUnchecked={() => this.setState({ enabledAutoComplete: false })} />
            <p className="help">Enable/Disable auto complete for the query box.</p>
          </div>
          <div className="field">
            <Checkbox
              name="enabledLiveAutoComplete"
              label="Enabled Live Auto Complete"
              defaultChecked={this.state.enabledLiveAutoComplete}
              onChecked={() => this.setState({ enabledLiveAutoComplete: true })}
              onUnchecked={() => this.setState({ enabledLiveAutoComplete: false })} />
            <p className="help">Enable/Disable live auto complete for the query box.</p>
          </div>
        </div>
      </div>
    );
  }

  renderLoggingSettingsPanel() {
    const log = this.state.log || {};
    return (
      <div className="ui segment">
        <div className="one field">
          Logging
        </div>
        <div>
          <div className="two fields">
            <div className="field">
              <Checkbox
                name="log.console"
                label="Console"
                defaultChecked={log.console}
                onChecked={() => this.handleChange({
                  target: { name: 'log.console', value: true },
                })}
                onUnchecked={() => this.handleChange({
                  target: { name: 'log.console', value: false },
                })} />
              <p className="help">Show logs in the dev tools panel.</p>
            </div>

            <div className="field">
              <Checkbox
                name="log.file"
                label="File"
                defaultChecked={log.file}
                onChecked={() => this.handleChange({
                  target: { name: 'log.file', value: true },
                })}
                onUnchecked={() => this.handleChange({
                  target: { name: 'log.file', value: false },
                })} />
              <p className="help">Save logs into a file.</p>
            </div>
          </div>

          <div className="two fields">
            <div className={`field ${this.highlightError('log.path')}`}>
              <label>Path</label>
              <div className="ui action input">
                <input type="text"
                  name="log.path"
                  placeholder="~/.sqlectron.log"
                  value={log.path || ''}
                  onChange={::this.handleChange} />
                <label htmlFor="file.log.path" className="ui icon button btn-file">
                  <i className="file outline icon" />
                  <input
                    type="file"
                    id="file.log.path"
                    name="file.log.path"
                    onChange={::this.handleChange}
                    style={{ display: 'none' }} />
                </label>
              </div>
              <p className="help">Log file path.</p>
            </div>
            <div id="logLevel" className={`field ${this.highlightError('log.level')}`}>
              <label>Level</label>
              <Select
                name="log.level"
                options={[
                  { value: 'debug', label: 'Debug', icon: 'bug' },
                  { value: 'info', label: 'Info', icon: 'info' },
                  { value: 'warn', label: 'Warn', icon: 'warning sign' },
                  { value: 'error', label: 'Error', icon: 'remove circle' },
                ]}
                clearable={false}
                onChange={::this.handleOnLogLevelChange}
                optionRenderer={this.renderLogLevelItem}
                valueRenderer={this.renderLogLevelItem}
                value={log.level || 'error'} />
              <p className="help">Level logging: debug, info, warn, error.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div id="settings-modal" className="ui modal" ref="settingsModal">
        <div className="header">
          Settings
        </div>
        <div className="content">
          <form className="ui form">
            {this.renderBasicSettingsPanel()}
            {this.renderLoggingSettingsPanel()}
            {this.renderSettingsPath()}
          </form>
        </div>
        {this.renderActionsPanel()}
      </div>
    );
  }
}
