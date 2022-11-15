function configure(serviceName: string, displayName: string, fieldName: string) {
  const schema = {
    type: 'object',
    properties: {
      [fieldName]: {
        title: displayName,
        type: 'string',
      },
    },
    required: [fieldName],
  };

  const uiSchema = {
    type: 'VerticalLayout',
    elements: [
      {
        label: `Your ${serviceName} ${displayName}`,
        type: 'Control',
        scope: `#/properties/${fieldName}`,
        options: {
          format: 'password',
        },
      },
    ],
  };

  return { schema, uiSchema };
}

export { configure };
