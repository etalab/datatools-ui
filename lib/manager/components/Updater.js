import React, {PropTypes, Component} from 'react'
import {Button, Col, Panel, Glyphicon, Form, FormGroup, ControlLabel, FormControl} from 'react-bootstrap'

import {getMessage, getComponentMessages} from '../../common/util/config'
import {UPDATER_FIELDS} from '../util/deployment'

export default class Updater extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    onRemove: PropTypes.func,
    updater: PropTypes.object
  }

  _onChange = (evt) => this.props.onChange(evt, this.props.index)

  // _onChangeNumber = (evt) => this.props.onChange(this.props.index, {[evt.target.name]: evt.target.value})

  _onRemove = () => this.props.onRemove(this.props.index)

  render () {
    const messages = getComponentMessages('ProjectSettings')
    const {updater} = this.props
    return (
      <Panel
        header={`${updater.type || '[type]'} - ${updater.url || '[url]'}`}
        defaultExpanded={!updater.type}
        collapsible>
        <Form>
          <Button
            bsSize='xsmall'
            bsStyle='danger'
            className='pull-right'
            onClick={this._onRemove}>
            Remove <Glyphicon glyph='remove' />
          </Button>
          {UPDATER_FIELDS.map((f, i) => {
            const fieldName = f.name.split('.').slice(-1)[0]
            return (
              <Col key={i} xs={f.width || 6}>
                <FormGroup>
                  <ControlLabel>{getMessage(messages, `deployment.${f.name}`)}</ControlLabel>
                  <FormControl
                    value={updater[fieldName]}
                    {...f}
                    name={f.name}
                    children={f.children
                      ? f.children.sort((a, b) => {
                        if (a.value < b.value) return -1
                        if (a.value > b.value) return 1
                        return 0
                      }).map((o, i) => (
                        <option key={i} {...o} />
                      ))
                      : undefined
                    }
                    onChange={this._onChange} />
                </FormGroup>
              </Col>
            )
          })}
        </Form>
      </Panel>
    )
  }
}
