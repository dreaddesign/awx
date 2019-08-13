import React, { Component } from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import { CardBody } from '@patternfly/react-core';
import JobTemplateForm from '../shared/JobTemplateForm';
import { JobTemplatesAPI } from '@api';
import { JobTemplate } from '@types';

class JobTemplateEdit extends Component {
  static propTypes = {
    template: JobTemplate.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      error: '',
    };

    const {
      template: { id, type },
    } = props;
    this.detailsUrl = `/templates/${type}/${id}/details`;

    this.handleCancel = this.handleCancel.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.submitLabels = this.submitLabels.bind(this);
  }

  async handleSubmit(values, newLabels = [], removedLabels = []) {
    const {
      template: { id, type },
      history,
    } = this.props;

    try {
      await JobTemplatesAPI.update(id, { ...values });
      await Promise.all([this.submitLabels(newLabels, removedLabels)]);
      history.push(this.detailsUrl);
    } catch (error) {
      this.setState({ error });
    }
  }

  async submitLabels(newLabels, removedLabels) {
    const {
      template: { id },
    } = this.props;
    const disassociationPromises = removedLabels.map(label =>
      JobTemplatesAPI.disassociateLabel(id, label)
    );
    const associationPromises = newLabels
      .filter(label => !label.organization)
      .map(label => JobTemplatesAPI.associateLabel(id, label));
    const creationPromises = newLabels
      .filter(label => label.organization)
      .map(label => JobTemplatesAPI.generateLabel(id, label));

    const results = await Promise.all([
      ...disassociationPromises,
      ...associationPromises,
      ...creationPromises,
    ]);
    return results;
  }

  handleCancel() {
    const { history } = this.props;
    history.push(this.detailsUrl);
  }

  render() {
    const { template } = this.props;
    const { error } = this.state;
    const canEdit = template.summary_fields.user_capabilities.edit;

    if (!canEdit) {
      return <Redirect to={this.detailsUrl} />;
    }

    return (
      <CardBody>
        <JobTemplateForm
          template={template}
          handleCancel={this.handleCancel}
          handleSubmit={this.handleSubmit}
        />
        {error ? <div> error </div> : null}
      </CardBody>
    );
  }
}

export default withRouter(JobTemplateEdit);
