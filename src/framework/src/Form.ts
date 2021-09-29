import * as fs from 'fs';

import { JsonSchema } from './models/jsonSchema';
import { UISchemaElement } from './models/uischema';

const formTemplate = fs.readFileSync(__dirname + '/form/form.html', { encoding: 'utf8' });

/**
 * Programmatically specify a form to be rendered in MaterialUI, allowing a user to specify configuration
 * during an integration configuration.
 */
export interface IFormSpecification {
  /** A schema for the data, in the JsonSchema format */
  schema: JsonSchema;
  /** The layout of the UI the form should provide the user. */
  uiSchema: UISchemaElement;
  /** Default values to populate the form with. */
  data: any;
  /** Additional state for the form to supply when submitted. */
  state: any;

  /** Post the form results to the submitUrl. */
  submitUrl: string;
  /** Send the user to the cancelUrl on cancellation. */
  cancelUrl: string;
  /** Title of the dialog surrounding the form. */
  dialogTitle: string;
  /** Title of the window in the browser. */
  windowTitle: string;
  /**
   * Optional HTML template that contains the following artifacts to be replaced by other values in the
   * IFormSpecification:
   *   - ##schema##
   *   - ##uischema##
   *   - ##data##
   *   - ##state##
   *   - ##dialogTitle##
   *   - ##windowTitle##
   *   - ##submitUrl##
   *   - ##cancelUrl##
   */
  template?: string;
}

/**
 * Create an HTML Form, using MaterialUI, from the supplied JSON Schema.
 */
export const Form = (spec: IFormSpecification) => {
  const form = (spec.template || formTemplate)
    .replace('##schema##', JSON.stringify(spec.schema))
    .replace('##uischema##', JSON.stringify(spec.uiSchema))
    .replace('##data##', JSON.stringify(spec.data))
    .replace('##windowTitle##', spec.windowTitle)
    .replace('##dialogTitle##', spec.dialogTitle)
    .replace('##state##', JSON.stringify(spec.state))
    .replace('##submitUrl##', `"${spec.submitUrl}"`)
    .replace('##cancelUrl##', `"${spec.cancelUrl}"`);

  return [form, 'text/html; charset=UTF-8'];
};
