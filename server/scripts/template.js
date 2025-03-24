module.exports = (api, options, state) => {
    const tpl = api.template.smart({ plugins: ['jsx'] });
    return tpl.ast`
      import * as React from 'react';
      const ${state.componentName} = React.forwardRef((props, ref) => ${state.jsx};
      export default ${state.componentName};
    `;
  };