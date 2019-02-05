import { render, Component } from 'inferno';
import invariant from 'invariant';
import document from 'global/document';
import { Provider } from 'inferno-redux';
import * as core from 'dva-core';
import { isFunction } from 'dva-core/lib/utils';

export default function (opts = {}) {
  const app = core.create(opts);
  const oldAppStart = app.start;
  app.router = router;
  app.start = start;
  return app;

  function router(router) {
    invariant(
      isFunction(router),
      `[app.router] router should be function, but got ${typeof router}`,
    );
    app._router = router;
  }

  function start(container) {
    // 允许 container 是字符串，然后用 querySelector 找元素
    if (isString(container)) {
      container = document.querySelector(container);
      invariant(
        container,
        `[app.start] container ${container} not found`,
      );
    }

    // 并且是 HTMLElement
    invariant(
      !container || isHTMLElement(container),
      `[app.start] container should be HTMLElement`,
    );

    // 路由必须提前注册
    invariant(
      app._router,
      `[app.start] router must be registered before app.start()`,
    );

    if (!app._store) {
      oldAppStart.call(app);
    }
    const store = app._store;

    // export _getProvider for HMR
    // ref: https://github.com/dvajs/dva/issues/469
    app._getProvider = getProvider.bind(null, store, app);

    // If has container, render; else, return inferno component
    if (container) {
      _render(container, store, app, app._router);
      app._plugin.apply('onHmr')(_render.bind(null, container, store, app));
    } else {
      return getProvider(store, this, this._router);
    }
  }
}

function isHTMLElement(node) {
  return typeof node === 'object' && node !== null && node.nodeType && node.nodeName;
}

function isString(str) {
  return typeof str === 'string';
}

function getProvider(store, app, router) {
  return extraProps => (
    <Provider store={store}>
      { router({ app, ...extraProps }) }
    </Provider>
  );
}

function _render(container, store, app, router) {
  const WrappedComponent = getProvider(store, app, router);
  render(<WrappedComponent />, container);
}
