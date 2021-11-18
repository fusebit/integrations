export default () => {
  return {
    getSigningKey: () => {
      return {
        getPublicKey: () => 'just a dummy value that will not be used',
      };
    },
  };
};
